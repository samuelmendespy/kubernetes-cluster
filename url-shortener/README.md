# URL Shortener

An URL shortener API built with Node.js and TypeScript. It allows users to shorten long URLs, track clicks, and manage redirects efficiently. It utilizes MongoDB Atlas for persistent storage and Redis for high-performance caching, all orchestrated with Docker Compose.

---

### Features

* **URL Shortener:** Transforms a long URLs into a short url, providing a link more readable and memorable.
* **Persistent Storage:** Saves URL mappings in MongoDB Atlas.
* **High-Performance Caching:** Uses Redis to cache shortened URLs, ensuring fast responses for frequently accessed redirects.
* **Click Tracking:** Records and increments the number of accesses for each shortened URL.
* **Intelligent Redirection:** Seamlessly redirects users to the original URL.
* **Interactive API Documentation:** Integrated with Swagger UI for easy exploration and testing of endpoints.
* **Docker Containers:** Isolated and reproducible environment for development and production.

---

### Technologies

* **Backend:**
    * **Node.js (v22):** JavaScript runtime environment.
    * **TypeScript:** Superset of JavaScript that adds static typing.
    * **Express.js:** Web framework for Node.js.
    * **Mongoose:** ODM (Object Data Modeling) for MongoDB.
    * **shortid:** Library for generating unique short codes.
    * **dotenv:** For loading environment variables.
    * **swagger-ui-express, yamljs:** For API documentation with Swagger/OpenAPI.
* **Database:**
    * **MongoDB Atlas:** Remote NoSQL database service (cloud-based).
* **Cache:**
    * **Redis (7.2-alpine):** In-memory data store for caching.
* **Orchestration:**
    * **Docker Compose:** For defining and running multi-container Docker applications.

---

### Project Structure

```
.
├── .env                  # Environment variables
├── docker-compose.yml    # Docker services configuration
├── package.json          # Node.js project dependencies and scripts
├── src/
│   └── app.ts            # Node Express application
├── swagger.yaml          # OpenAPI/Swagger API definition
├── tsconfig.json         # TypeScript configurations
└── README.md
```

### Prerequisites

Before you start, make sure you have the following tools installed:

* **Docker Desktop:** Includes Docker Engine and Docker Compose.
    * [Download Docker Desktop](https://www.docker.com/products/docker-desktop/)
* **Node.js and npm/yarn:** (Optional, if you prefer to run locally without Docker for backend development, but for the complete setup, Docker is sufficient).

---

### Project Setup

1.  **Clone the Repository:**

    ```bash
    git clone https://github.com/your-username/your-project.git
    cd your-project
    ```

2.  **MongoDB Atlas Configuration:**
    * Create an account on [MongoDB Atlas](https://cloud.mongodb.com/).
    * Create a new Cluster.
    * Create a **database user** with a password and the necessary permissions.
    * In the **Network Access** section, **add the public IP address(es) of the machine where Docker is running**. If you're developing locally (in Teresina, for example), add your current IP. For testing purposes, you can temporarily "Allow Access from Anywhere" (0.0.0.0/0), but **DO NOT USE THIS IN PRODUCTION ENVIRONMENTS** due to security risks.
    * Obtain your cluster's **Connection String** (URI). It will look similar to `mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/?retryWrites=true&w=majority`.

3.  **Create the .env file:**
    In the root of your project, create a file named `.env` and add the following environment variables:

    ```txt
    PORT=3000
    MONGO_URI="YOUR_MONGODB_ATLAS_CONNECTION_STRING"
    REDIS_HOST="redis" # Redis service name in docker-compose
    REDIS_PORT=6379
    ```

    **Remember to replace "YOUR_MONGODB_ATLAS_CONNECTION_STRING" with the actual URI of your MongoDB Atlas cluster, including your username and password.**

4.  **Create the swagger.yaml file:**
    In the root of your project, create the `swagger.yaml` file with your API's OpenAPI definition (as per the example provided earlier).

---

### How to Run the Project

1.  **Build Docker Images:**
    This command will build the Docker images for your Node.js service and Redis.

    ```bash
    docker-compose build
    ```

2.  **Start Containers:**
    This command will start the services defined in your `docker-compose.yml` (usually `app` for Node.js and `redis` for Redis).

    ```bash
    docker-compose up
    ```
    To run in the background, use `docker-compose up -d`.

3.  **Access the Application:**
    * The API will be available at `http://localhost:3000`.
    * The interactive API documentation (Swagger UI) will be available at `http://localhost:3000/v3/api-docs`.

---

### API Endpoints

* **`POST /generate`**
    * **Description:** Generates a shortened URL for a target (long) URL.
    * **Request Body (JSON):**
        ```JSON
        {
          "longUrl": "https://github.com/samuelmendespy/kubernetes-cluster"
        }
        ```
    * **Response (Success - 201 Created):**
        ```JSON
        {
          "message": "URL shortened successfully",
          "shortUrl": "http://localhost:3000/abcdEFg"
        }
        ```
    * **Response (URL already shortened - 200 OK):**
        ```JSON
        {
          "message": "URL already shortened",
          "shortUrl": "http://localhost:3000/abcdEFg"
        }
        ```
    * **Errors:** `400 Bad Request` (invalid or missing URL), `500 Internal Server Error`.

* **`GET /:shortCode`**
    * **Description:** Redirects the website visitor to the original URL and increments the click counter.
    * **URL Parameter:** `:shortCode` (the generated short code).
    * **Example:** `http://localhost:3000/abcdEFg`
    * **Behavior:** Redirets with `302 Found` status to the corresponding `longUrl`.
    * **Errors:** `404 Not Found` (short code not found), `500 Internal Server Error`.