import express from "express";
import ejs from "ejs";

const app = express();

app.set("view engine", "ejs");
app.set("port", 3000);
app.use(express.static("public"));





app.listen(app.get("port"), () => {
    console.log(`Server is running on port ${app.get("port")}`);
});