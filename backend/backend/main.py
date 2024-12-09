from fastapi import FastAPI, HTTPException, Form, Depends
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.security import OAuth2PasswordBearer
from pathlib import Path
from config import CONFIG
from db import lifespan
from security import hash_password, verify_password, create_access_token, decode_access_token
from datetime import datetime
import logging

logging.basicConfig(level=logging.INFO)

app = FastAPI(lifespan=lifespan)

frontend_build_path = Path(CONFIG["frontend"]["build_path"]).resolve()
index_path = frontend_build_path / "index.html"

if not index_path.exists():
    raise RuntimeError(f"index.html not found at {index_path}")

app.mount("/static", StaticFiles(directory=frontend_build_path / "static"), name="static")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/login")


async def get_current_user(token: str = Depends(oauth2_scheme)):
    """
    Validate the token and retrieve the current user.
    """
    try:
        payload = decode_access_token(token)
        username = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return username
    except Exception as e:
        logging.error(f"Token validation failed: {str(e)}")
        raise HTTPException(status_code=401, detail="Invalid or expired token")


@app.get("/validate-token")
async def validate_token(current_user: str = Depends(get_current_user)):
    """
    Validates the current user's token.
    """
    try:
        # If `get_current_user` doesn't raise an exception, the token is valid
        return {"success": True, "username": current_user}
    except HTTPException as e:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


@app.get("/item/{item_id}")
async def find_item_and_pieces(item_id: int, current_user: str = Depends(get_current_user)):
    """
    Fetch an item by item_id and its associated pieces (if any).
    Always returns the item details, even if there are no pieces.
    """
    try:
        async with app.async_pool.connection() as conn:
            async with conn.cursor() as cur:
                # Step 1: Check if the item exists
                item_query = """
                    SELECT itemid, idescription, photo, color, isnew, haspieces, material, maincategory, subcategory
                    FROM item
                    WHERE itemid = %s
                """
                await cur.execute(item_query, (item_id,))
                item = await cur.fetchone()

                if not item:
                    raise HTTPException(status_code=404, detail="Item not found for the given item_id")

                # Step 2: Fetch associated pieces
                pieces_query = """
                    SELECT piecenum, pdescription, length, width, height, roomnum, shelfnum, pnotes
                    FROM piece
                    WHERE itemid = %s
                """
                await cur.execute(pieces_query, (item_id,))
                pieces = await cur.fetchall()

                # Step 3: Prepare the response
                item_data = {
                    "itemID": item[0],
                    "description": item[1],
                    "photo": item[2],
                    "color": item[3],
                    "isNew": item[4],
                    "hasPieces": item[5],
                    "material": item[6],
                    "mainCategory": item[7],
                    "subCategory": item[8],
                    "pieces": [
                        {
                            "pieceNum": piece[0],
                            "pDescription": piece[1],
                            "length": piece[2],
                            "width": piece[3],
                            "height": piece[4],
                            "roomNum": piece[5],
                            "shelfNum": piece[6],
                            "pNotes": piece[7],
                        }
                        for piece in pieces
                    ],
                }

                return {"success": True, "item": item_data}

    except HTTPException as e:
        # Re-raise HTTP exceptions
        raise e
    except Exception as e:
        logging.error(f"Error fetching item and pieces: {str(e)}")
        raise HTTPException(status_code=500, detail="An error occurred while fetching the item and its pieces.")


@app.get("/")
async def serve_react_frontend():
    return FileResponse(index_path)


async def execute_query(query: str, params: tuple):
    """Utility function to execute a query with the connection pool."""
    async with app.async_pool.connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute(query, params)


@app.post("/register")
async def register(
    first_name: str = Form(...),
    last_name: str = Form(...),
    username: str = Form(...),
    password: str = Form(...),
    role: str = Form(...),
    billAddr: str = Form(None)
):
    """
    Register a new user by hashing their password and storing their details.
    """
    try:
        logging.info(f"Received registration request for username: {username}")

        # Hash the password
        hashed_password = hash_password(password)
        logging.info("Password hashed successfully")

        # Insert into the database
        query = """
            INSERT INTO public.users (first_name, last_name, username, password, role, billAddr)
            VALUES (%s, %s, %s, %s, %s, %s)
        """
        logging.info(f"Executing query with params: {first_name}, {last_name}, {username}, {role}, {billAddr}")
        await execute_query(query, (first_name, last_name, username, hashed_password, role, billAddr))
        logging.info("User inserted into database successfully")

        # Return success response
        return {"success": True, "message": "User registered successfully"}

    except HTTPException as e:
        logging.error(f"HTTP Exception: {e.detail}")
        raise e
    except Exception as e:
        logging.error(f"Unexpected error: {str(e)}")
        raise HTTPException(status_code=400, detail="Registration failed. Ensure username is unique and inputs are valid.")


@app.post("/login")
async def login(
    username: str = Form(...),
    password: str = Form(...)
):
    """
    Authenticate the user and return a JWT if credentials are valid.
    """
    try:
        # Fetch user data from the database
        query = "SELECT username, password FROM public.users WHERE username = %s"
        async with app.async_pool.connection() as conn:
            async with conn.cursor() as cur:
                await cur.execute(query, (username,))
                user = await cur.fetchone()
                if not user:
                    raise HTTPException(status_code=400, detail="Invalid username or password")

        # Verify the password
        db_username, db_password = user
        if not verify_password(password, db_password):
            raise HTTPException(status_code=400, detail="Invalid username or password")

        # Create a JWT token
        access_token = create_access_token(data={"sub": db_username})
        return {"access_token": access_token, "token_type": "bearer"}

    except HTTPException as e:
        logging.error(f"HTTP Exception during login: {e.detail}")
        raise e
    except Exception as e:
        logging.error(f"Unexpected error during login: {str(e)}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred")


@app.get("/order/{order_id}")
async def find_order_items(order_id: int, current_user: str = Depends(get_current_user)):
    """
    Fetch and return all items in a given order, along with the locations of their pieces.
    Requires the user to be authenticated.
    """
    try:
        async with app.async_pool.connection() as conn:
            async with conn.cursor() as cur:
                # Step 1: Check if the order exists
                query_order = """
                    SELECT orderid, orderdate, ordernotes, supervisor, client
                    FROM ordered
                    WHERE orderid = %s
                """
                await cur.execute(query_order, (order_id,))
                order = await cur.fetchone()

                if not order:
                    raise HTTPException(status_code=404, detail="Order not found for the given order ID")

                # Step 2: Fetch all items and their pieces for this order
                query_items = """
                    SELECT 
                        i.itemid,
                        i.idescription,
                        i.color,
                        i.isnew,
                        i.material,
                        p.piecenum,
                        p.pdescription,
                        p.length,
                        p.width,
                        p.height,
                        l.roomnum,
                        l.shelfnum,
                        l.shelfdescription
                    FROM itemin ii
                    LEFT JOIN item i ON ii.itemid = i.itemid
                    LEFT JOIN piece p ON i.itemid = p.itemid
                    LEFT JOIN location l ON p.roomnum = l.roomnum AND p.shelfnum = l.shelfnum
                    WHERE ii.orderid = %s
                """
                await cur.execute(query_items, (order_id,))
                results = await cur.fetchall()

                # Process results into structured response
                items = {}
                for row in results:
                    item_id, i_desc, color, is_new, material, piece_num, p_desc, length, width, height, room_num, shelf_num, shelf_desc = row

                    if item_id not in items:
                        items[item_id] = {
                            "itemID": item_id,
                            "description": i_desc,
                            "color": color,
                            "isNew": is_new,
                            "material": material,
                            "pieces": [],
                        }

                    if piece_num is not None:
                        items[item_id]["pieces"].append({
                            "pieceNum": piece_num,
                            "description": p_desc,
                            "dimensions": {"length": length, "width": width, "height": height},
                            "location": {
                                "roomNum": room_num,
                                "shelfNum": shelf_num,
                                "shelfDescription": shelf_desc,
                            },
                        })

                # Step 3: Return structured data
                return {
                    "success": True,
                    "orderID": order_id,
                    "items": list(items.values()) if items else [],
                }

    except HTTPException as e:
        raise e  # Handle HTTP errors (e.g., 404) gracefully
    except Exception:
        raise HTTPException(status_code=500, detail="An error occurred while fetching order items.")    


@app.get("/user-info")
async def get_user_info(current_user: str = Depends(get_current_user)):
    """
    Retrieve the logged-in user's information based on the token.
    """
    try:
        query = """
            SELECT first_name, last_name, role
            FROM public.users
            WHERE username = %s
        """
        async with app.async_pool.connection() as conn:
            async with conn.cursor() as cur:
                await cur.execute(query, (current_user,))
                user = await cur.fetchone()
                if not user:
                    raise HTTPException(status_code=404, detail="User not found")

                first_name, last_name, role = user
                return {
                    "success": True,
                    "username": current_user,
                    "first_name": first_name,
                    "last_name": last_name,
                    "role": role,
                }
    except HTTPException as e:
        raise e
    except Exception as e:
        logging.error(f"Error fetching user info: {str(e)}")
        raise HTTPException(status_code=500, detail="An error occurred while fetching user info.")


@app.post("/donate")
async def accept_donation(
    donor_username: str = Form(...),
    item_description: str = Form(...),
    photo: str = Form(None),
    color: str = Form(None),
    is_new: bool = Form(...),
    material: str = Form(None),
    main_category: str = Form(...),
    sub_category: str = Form(...),
    staff_username: str = Depends(get_current_user),
    piece_data: str = Form("[]")  # Default to an empty array if no pieces are provided
):
    """
    Accept a donation and record it in the database.
    Only staff members can perform this action.
    """
    try:
        async with app.async_pool.connection() as conn:
            async with conn.transaction():  # Start a transaction
                async with conn.cursor() as cur:
                    # a. Verify the user is a staff member
                    query_role_check = """
                        SELECT role FROM public.users WHERE username = %s
                    """
                    await cur.execute(query_role_check, (staff_username,))
                    user_role = await cur.fetchone()

                    if not user_role or user_role[0] != "staff":
                        raise HTTPException(status_code=403, detail="Unauthorized: Only staff members can accept donations")

                    # b. Check that the donor is registered as a donor
                    query_donor_check = """
                        SELECT role FROM public.users WHERE username = %s AND role = 'donor'
                    """
                    await cur.execute(query_donor_check, (donor_username,))
                    donor_role = await cur.fetchone()

                    if not donor_role:
                        raise HTTPException(status_code=400, detail="Donor is not registered or does not exist")

                    # c. Insert the donated item into the `Item` table
                    query_insert_item = """
                        INSERT INTO public.item (iDescription, photo, color, isNew, material, mainCategory, subCategory)
                        VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING ItemID
                    """
                    await cur.execute(query_insert_item, (
                        item_description, photo, color, is_new, material, main_category, sub_category
                    ))
                    item_id = (await cur.fetchone())[0]  # Get the generated ItemID

                    # d. Insert the donation record into `DonatedBy`
                    query_insert_donation = """
                        INSERT INTO public.donatedby (ItemID, userName, donateDate)
                        VALUES (%s, %s, %s)
                    """
                    await cur.execute(query_insert_donation, (item_id, donor_username, datetime.utcnow().date()))

                    # e. Insert pieces and their locations into the `Piece` table
                    if piece_data:
                        try:
                            piece_data_list = eval(piece_data) if isinstance(piece_data, str) else piece_data
                            query_insert_piece = """
                                INSERT INTO public.piece (ItemID, pieceNum, pDescription, length, width, height, roomNum, shelfNum, pNotes)
                                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                            """
                            for piece in piece_data_list:
                                await cur.execute(query_insert_piece, (
                                    item_id, piece["pieceNum"], piece["pDescription"], piece["length"],
                                    piece["width"], piece["height"], piece["roomNum"], piece["shelfNum"],
                                    piece.get("pNotes", None)
                                ))
                        except Exception as e:
                            logging.error(f"Invalid piece data: {piece_data}")
                            raise HTTPException(status_code=400, detail="Invalid piece data provided.")

                # If all steps succeed, the transaction is automatically committed.
                return {"success": True, "message": "Donation accepted successfully", "item_id": item_id}

    except HTTPException as e:
        # Rollback happens automatically on an exception
        raise e
    except Exception as e:
        # Rollback happens automatically on an exception
        logging.error(f"Unexpected error: {str(e)}")
        raise HTTPException(status_code=500, detail="An error occurred while accepting the donation.")


# Utility to validate staff role
async def validate_staff_role(current_user: str, conn) -> bool:
    query = "SELECT role FROM users WHERE username = %s"
    async with conn.cursor() as cur:
        await cur.execute(query, (current_user,))
        user_role = await cur.fetchone()
        if user_role and user_role[0] == "staff":
            return True
    return False


@app.post("/start-order")
async def start_order(
    client_username: str = Form(...),
    current_user: str = Depends(get_current_user),  # Token-based logged-in user
):
    """
    Start a new order for a client. Only staff can perform this operation.
    """
    async with app.async_pool.connection() as conn:
        try:
            # 1. Validate staff role
            is_staff = await validate_staff_role(current_user, conn)
            if not is_staff:
                raise HTTPException(status_code=403, detail="Unauthorized: Only staff can start orders.")

            # 2. Validate the client exists
            query_client_check = "SELECT role FROM users WHERE username = %s AND role = 'client'"
            async with conn.cursor() as cur:
                await cur.execute(query_client_check, (client_username,))
                client = await cur.fetchone()
                if not client:
                    raise HTTPException(status_code=400, detail="Invalid client username.")

            # 3. Create a new order
            query_insert_order = """
                INSERT INTO ordered (orderDate, orderNotes, supervisor, client)
                VALUES (%s, %s, %s, %s) RETURNING orderID
            """
            async with conn.cursor() as cur:
                await cur.execute(query_insert_order, (datetime.utcnow().date(), "", current_user, client_username))
                order_id = (await cur.fetchone())[0]

            # 4. Return the order ID
            return {"success": True, "order_id": order_id}

        except HTTPException as e:
            raise e
        except Exception as e:
            logging.error(f"Error starting order: {str(e)}")
            raise HTTPException(status_code=500, detail="An error occurred while starting the order.")


@app.get("/categories")
async def get_categories():
    """
    Fetch all main and subcategories for the dropdown menu.
    """
    try:
        query = "SELECT mainCategory, subCategory FROM public.category"
        async with app.async_pool.connection() as conn:
            async with conn.cursor() as cur:
                await cur.execute(query)
                categories = await cur.fetchall()
                return {
                    "success": True,
                    "categories": [
                        {"mainCategory": row[0], "subCategory": row[1]} for row in categories
                    ],
                }
    except Exception as e:
        logging.error(f"Error fetching categories: {str(e)}")
        raise HTTPException(status_code=500, detail="An error occurred while fetching categories.")


@app.get("/available-items")
async def get_available_items(mainCategory: str, subCategory: str):
    """
    Fetch all items in the specified category and subcategory that are not already ordered.
    """
    try:
        query = """
            SELECT i.ItemID, i.iDescription, i.color, i.material, i.isNew
            FROM public.item i
            LEFT JOIN public.itemin ii ON i.ItemID = ii.ItemID
            WHERE i.mainCategory = %s AND i.subCategory = %s AND ii.ItemID IS NULL
        """
        async with app.async_pool.connection() as conn:
            async with conn.cursor() as cur:
                await cur.execute(query, (mainCategory, subCategory))
                items = await cur.fetchall()
                return {
                    "success": True,
                    "items": [
                        {"ItemID": row[0], "iDescription": row[1], "color": row[2], "material": row[3], "isNew": row[4]} 
                        for row in items
                    ],
                }
    except Exception as e:
        logging.error(f"Error fetching available items: {str(e)}")
        raise HTTPException(status_code=500, detail="An error occurred while fetching available items.")


@app.post("/add-to-order")
async def add_to_order(
    item_id: int = Form(...),
    current_order_id: int = Form(...),  # Order ID from session
    staff_username: str = Depends(get_current_user),
):
    """
    Add an item to the current order and mark it as ordered.
    """
    try:
        # Check if the user is a staff member
        query_role_check = "SELECT role FROM public.users WHERE username = %s"
        async with app.async_pool.connection() as conn:
            async with conn.cursor() as cur:
                await cur.execute(query_role_check, (staff_username,))
                user_role = await cur.fetchone()
                if not user_role or user_role[0] != "staff":
                    raise HTTPException(status_code=403, detail="Unauthorized: Only staff can add items to orders")

                # Add the item to the order
                query_add_item = """
                    INSERT INTO public.itemin (ItemID, orderID, found)
                    VALUES (%s, %s, FALSE)
                """
                await cur.execute(query_add_item, (item_id, current_order_id))

                return {"success": True, "message": "Item added to the order successfully"}

    except HTTPException as e:
        raise e
    except Exception as e:
        logging.error(f"Error adding item to order: {str(e)}")
        raise HTTPException(status_code=500, detail="An error occurred while adding item to the order.")


@app.get("/current-order")
async def get_current_order(order_id: int, current_user: str = Depends(get_current_user)):
    """
    Fetch current order details along with items.
    """
    try:
        query_order = """
            SELECT o.orderID, o.orderDate, o.orderNotes, o.supervisor, o.client
            FROM ordered o
            WHERE o.orderID = %s
        """
        query_items = """
            SELECT i.ItemID, i.iDescription, i.color
            FROM itemin ii
            JOIN item i ON ii.ItemID = i.ItemID
            WHERE ii.orderID = %s
        """
        async with app.async_pool.connection() as conn:
            async with conn.cursor() as cur:
                # Fetch order details
                await cur.execute(query_order, (order_id,))
                order = await cur.fetchone()
                if not order:
                    raise HTTPException(status_code=404, detail="Order not found")

                # Fetch items in the order
                await cur.execute(query_items, (order_id,))
                items = await cur.fetchall()

                return {
                    "orderID": order[0],
                    "orderDate": order[1],
                    "notes": order[2],
                    "supervisor": order[3],
                    "client": order[4],
                    "items": [
                        {"ItemID": item[0], "iDescription": item[1], "color": item[2]} for item in items
                    ],
                }
    except Exception as e:
        logging.error(f"Error fetching current order: {str(e)}")
        raise HTTPException(status_code=500, detail="An error occurred while fetching the current order.")    


@app.get("/rooms")
async def get_rooms():
    """
    Fetch available rooms.
    """
    try:
        query = "SELECT roomNum FROM public.location GROUP BY roomNum"
        async with app.async_pool.connection() as conn:
            async with conn.cursor() as cur:
                await cur.execute(query)
                rooms = await cur.fetchall()
                return {"rooms": [room[0] for room in rooms]}
    except Exception as e:
        logging.error(f"Error fetching rooms: {str(e)}")
        raise HTTPException(status_code=500, detail="An error occurred while fetching rooms.")

    
@app.get("/shelves")
async def get_shelves(room_num: int):
    """
    Fetch shelves for a given room.
    """
    try:
        query = "SELECT shelfNum FROM public.location WHERE roomNum = %s GROUP BY shelfNum"
        async with app.async_pool.connection() as conn:
            async with conn.cursor() as cur:
                await cur.execute(query, (room_num,))
                shelves = await cur.fetchall()
                return {"shelves": [shelf[0] for shelf in shelves]}
    except Exception as e:
        logging.error(f"Error fetching shelves: {str(e)}")
        raise HTTPException(status_code=500, detail="An error occurred while fetching shelves.")


@app.get("/{full_path:path}")
async def catch_all(full_path: str):
    return FileResponse(index_path)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
