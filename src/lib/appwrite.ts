import { Client, Account, Databases } from "appwrite";

const client = new Client()
    .setEndpoint("https://sgp.cloud.appwrite.io/v1")
    .setProject("6a79eb7d0027a520fe58");

const account = new Account(client);
const databases = new Databases(client);

export { client, account, databases };
