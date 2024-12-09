# db-proj
Configuration Requirements

To ensure the backend works correctly, a configuration file named config.toml must be accessible by main.py. This file should contain the necessary database and frontend configuration settings.

Example config.toml

[database]
name = "your_database_name"
user = "your_database_user"
password = "your_database_password"
host = "your_database_host"
port = 5432

[frontend]
build_path = "/path/to/your/frontend/build"

Notes:
- Replace your_database_name, your_database_user, your_database_password, and your_database_host with the actual credentials and host for your PostgreSQL database.
- The build_path should point to the directory where your frontend application is built. Adjust it based on your local setup.

Place the config.toml file in the same directory as main.py or ensure it is accessible from your project environment.
