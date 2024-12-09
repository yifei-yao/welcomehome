--
-- PostgreSQL database dump
--

-- Dumped from database version 14.15 (Homebrew)
-- Dumped by pg_dump version 14.15 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: category; Type: TABLE; Schema: public; Owner: yifeiyao
--

CREATE TABLE public.category (
    maincategory character varying(50) NOT NULL,
    subcategory character varying(50) NOT NULL,
    catnotes text
);


ALTER TABLE public.category OWNER TO yifeiyao;

--
-- Name: donatedby; Type: TABLE; Schema: public; Owner: yifeiyao
--

CREATE TABLE public.donatedby (
    itemid integer NOT NULL,
    username character varying(50) NOT NULL,
    donatedate date NOT NULL
);


ALTER TABLE public.donatedby OWNER TO yifeiyao;

--
-- Name: item; Type: TABLE; Schema: public; Owner: yifeiyao
--

CREATE TABLE public.item (
    itemid integer NOT NULL,
    idescription text,
    photo character varying(20),
    color character varying(20),
    isnew boolean DEFAULT true,
    haspieces boolean,
    material character varying(50),
    maincategory character varying(50) NOT NULL,
    subcategory character varying(50) NOT NULL
);


ALTER TABLE public.item OWNER TO yifeiyao;

--
-- Name: item_itemid_seq; Type: SEQUENCE; Schema: public; Owner: yifeiyao
--

CREATE SEQUENCE public.item_itemid_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.item_itemid_seq OWNER TO yifeiyao;

--
-- Name: item_itemid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: yifeiyao
--

ALTER SEQUENCE public.item_itemid_seq OWNED BY public.item.itemid;


--
-- Name: itemin; Type: TABLE; Schema: public; Owner: yifeiyao
--

CREATE TABLE public.itemin (
    itemid integer NOT NULL,
    orderid integer NOT NULL,
    found boolean DEFAULT false
);


ALTER TABLE public.itemin OWNER TO yifeiyao;

--
-- Name: location; Type: TABLE; Schema: public; Owner: yifeiyao
--

CREATE TABLE public.location (
    roomnum integer NOT NULL,
    shelfnum integer NOT NULL,
    shelf character varying(20),
    shelfdescription character varying(200)
);


ALTER TABLE public.location OWNER TO yifeiyao;

--
-- Name: ordered; Type: TABLE; Schema: public; Owner: yifeiyao
--

CREATE TABLE public.ordered (
    orderid integer NOT NULL,
    orderdate date NOT NULL,
    ordernotes character varying(200),
    supervisor character varying(50) NOT NULL,
    client character varying(50) NOT NULL
);


ALTER TABLE public.ordered OWNER TO yifeiyao;

--
-- Name: ordered_orderid_seq; Type: SEQUENCE; Schema: public; Owner: yifeiyao
--

CREATE SEQUENCE public.ordered_orderid_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.ordered_orderid_seq OWNER TO yifeiyao;

--
-- Name: ordered_orderid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: yifeiyao
--

ALTER SEQUENCE public.ordered_orderid_seq OWNED BY public.ordered.orderid;


--
-- Name: piece; Type: TABLE; Schema: public; Owner: yifeiyao
--

CREATE TABLE public.piece (
    itemid integer NOT NULL,
    piecenum integer NOT NULL,
    pdescription character varying(200),
    length integer NOT NULL,
    width integer NOT NULL,
    height integer NOT NULL,
    roomnum integer NOT NULL,
    shelfnum integer NOT NULL,
    pnotes text
);


ALTER TABLE public.piece OWNER TO yifeiyao;

--
-- Name: users; Type: TABLE; Schema: public; Owner: yifeiyao
--

CREATE TABLE public.users (
    cid integer NOT NULL,
    first_name character varying(100) NOT NULL,
    last_name character varying(100) NOT NULL,
    username character varying(100) NOT NULL,
    password character varying(256) NOT NULL,
    role character varying(50),
    billaddr character varying(255)
);


ALTER TABLE public.users OWNER TO yifeiyao;

--
-- Name: users_cid_seq; Type: SEQUENCE; Schema: public; Owner: yifeiyao
--

CREATE SEQUENCE public.users_cid_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.users_cid_seq OWNER TO yifeiyao;

--
-- Name: users_cid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: yifeiyao
--

ALTER SEQUENCE public.users_cid_seq OWNED BY public.users.cid;


--
-- Name: item itemid; Type: DEFAULT; Schema: public; Owner: yifeiyao
--

ALTER TABLE ONLY public.item ALTER COLUMN itemid SET DEFAULT nextval('public.item_itemid_seq'::regclass);


--
-- Name: ordered orderid; Type: DEFAULT; Schema: public; Owner: yifeiyao
--

ALTER TABLE ONLY public.ordered ALTER COLUMN orderid SET DEFAULT nextval('public.ordered_orderid_seq'::regclass);


--
-- Name: users cid; Type: DEFAULT; Schema: public; Owner: yifeiyao
--

ALTER TABLE ONLY public.users ALTER COLUMN cid SET DEFAULT nextval('public.users_cid_seq'::regclass);


--
-- Name: category category_pkey; Type: CONSTRAINT; Schema: public; Owner: yifeiyao
--

ALTER TABLE ONLY public.category
    ADD CONSTRAINT category_pkey PRIMARY KEY (maincategory, subcategory);


--
-- Name: donatedby donatedby_pkey; Type: CONSTRAINT; Schema: public; Owner: yifeiyao
--

ALTER TABLE ONLY public.donatedby
    ADD CONSTRAINT donatedby_pkey PRIMARY KEY (itemid, username);


--
-- Name: item item_pkey; Type: CONSTRAINT; Schema: public; Owner: yifeiyao
--

ALTER TABLE ONLY public.item
    ADD CONSTRAINT item_pkey PRIMARY KEY (itemid);


--
-- Name: itemin itemin_pkey; Type: CONSTRAINT; Schema: public; Owner: yifeiyao
--

ALTER TABLE ONLY public.itemin
    ADD CONSTRAINT itemin_pkey PRIMARY KEY (itemid, orderid);


--
-- Name: location location_pkey; Type: CONSTRAINT; Schema: public; Owner: yifeiyao
--

ALTER TABLE ONLY public.location
    ADD CONSTRAINT location_pkey PRIMARY KEY (roomnum, shelfnum);


--
-- Name: ordered ordered_pkey; Type: CONSTRAINT; Schema: public; Owner: yifeiyao
--

ALTER TABLE ONLY public.ordered
    ADD CONSTRAINT ordered_pkey PRIMARY KEY (orderid);


--
-- Name: piece piece_pkey; Type: CONSTRAINT; Schema: public; Owner: yifeiyao
--

ALTER TABLE ONLY public.piece
    ADD CONSTRAINT piece_pkey PRIMARY KEY (itemid, piecenum);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: yifeiyao
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (cid);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: yifeiyao
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: donatedby donatedby_itemid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: yifeiyao
--

ALTER TABLE ONLY public.donatedby
    ADD CONSTRAINT donatedby_itemid_fkey FOREIGN KEY (itemid) REFERENCES public.item(itemid) ON DELETE CASCADE;


--
-- Name: donatedby donatedby_username_fkey; Type: FK CONSTRAINT; Schema: public; Owner: yifeiyao
--

ALTER TABLE ONLY public.donatedby
    ADD CONSTRAINT donatedby_username_fkey FOREIGN KEY (username) REFERENCES public.users(username) ON DELETE CASCADE;


--
-- Name: item item_maincategory_subcategory_fkey; Type: FK CONSTRAINT; Schema: public; Owner: yifeiyao
--

ALTER TABLE ONLY public.item
    ADD CONSTRAINT item_maincategory_subcategory_fkey FOREIGN KEY (maincategory, subcategory) REFERENCES public.category(maincategory, subcategory);


--
-- Name: itemin itemin_itemid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: yifeiyao
--

ALTER TABLE ONLY public.itemin
    ADD CONSTRAINT itemin_itemid_fkey FOREIGN KEY (itemid) REFERENCES public.item(itemid);


--
-- Name: ordered ordered_client_fkey; Type: FK CONSTRAINT; Schema: public; Owner: yifeiyao
--

ALTER TABLE ONLY public.ordered
    ADD CONSTRAINT ordered_client_fkey FOREIGN KEY (client) REFERENCES public.users(username);


--
-- Name: ordered ordered_supervisor_fkey; Type: FK CONSTRAINT; Schema: public; Owner: yifeiyao
--

ALTER TABLE ONLY public.ordered
    ADD CONSTRAINT ordered_supervisor_fkey FOREIGN KEY (supervisor) REFERENCES public.users(username);


--
-- Name: piece piece_itemid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: yifeiyao
--

ALTER TABLE ONLY public.piece
    ADD CONSTRAINT piece_itemid_fkey FOREIGN KEY (itemid) REFERENCES public.item(itemid);


--
-- Name: piece piece_roomnum_shelfnum_fkey; Type: FK CONSTRAINT; Schema: public; Owner: yifeiyao
--

ALTER TABLE ONLY public.piece
    ADD CONSTRAINT piece_roomnum_shelfnum_fkey FOREIGN KEY (roomnum, shelfnum) REFERENCES public.location(roomnum, shelfnum);


--
-- PostgreSQL database dump complete
--

