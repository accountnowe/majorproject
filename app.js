const express = require("express");
const app = express();
const mongoose = require("mongoose");
const Listing = require("./models/listing");
const MONGO_URL = 'mongodb://127.0.0.1:27017/wanderlust'
const path = require('path');
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const session = require("express-session");
const bcrypt = require("bcryptjs");

// --- Hardcoded Credentials (Hashed) ---
// Password: wanderlust123
const ADMIN_USER = {
    email: "admin@wanderlust.com",
    name: "Admin",
    // Bcrypt hash for 'wanderlust123'
    passwordHash: "$2b$10$1pkJCvxe3v.Oqk.kP3rZ2uJ80utQn1IeCAXHpWnXMF1A1tsh78wB6"
};

main().then(() => {
    console.log("connected to db");
})
    .catch((err) => {
        console.log(err);
    })
async function main() {
    await mongoose.connect(MONGO_URL);
};

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.engine('ejs', ejsMate);
app.use(express.static(path.join(__dirname, "/public")));

// --- Session Middleware ---
app.use(session({
    secret: 'wanderlust-super-secret-key-2024',
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 // 1 day
    }
}));

// --- Make user available in all views ---
app.use((req, res, next) => {
    res.locals.currentUser = req.session.user || null;
    next();
});

// --- Home Route ---
app.get("/", (req, res) => {
    res.render("pages/home.ejs");
});

app.get("/about", (req, res) => {
    res.render("pages/about.ejs");
});

// --- Auth Routes ---
app.get("/login", (req, res) => {
    if (req.session.user) {
        return res.redirect("/dashboard");
    }
    res.render("users/login.ejs", { error: null });
});

app.post("/login", async (req, res) => {
    const { email, password } = req.body;

    // Check if credentials match
    if (email === ADMIN_USER.email) {
        // Compare password with bcrypt
        const isMatch = await bcrypt.compare(password, ADMIN_USER.passwordHash);
        if (isMatch) {
            req.session.user = {
                email: ADMIN_USER.email,
                name: ADMIN_USER.name
            };
            return res.redirect("/dashboard");
        }
    }

    // Invalid credentials
    res.render("users/login.ejs", { error: "Invalid email or password. Please try again." });
});

app.get("/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.log("Error destroying session:", err);
        }
        res.redirect("/");
    });
});

app.get("/dashboard", (req, res) => {
    if (!req.session.user) {
        return res.redirect("/login");
    }
    res.render("users/dashboard.ejs", { user: req.session.user });
});

// --- Listings Routes ---
app.get("/listings", async (req, res) => {
    const allListings = await Listing.find({});
    res.render("./listings/index.ejs", { allListings });
});

app.get("/listings/new", (req, res) => {
    res.render("listings/new.ejs");
});

app.delete("/listings/:id", async (req, res) => {
    let { id } = req.params;
    let deletedListing = await Listing.findByIdAndDelete(id);
    console.log(deletedListing);
    res.redirect("/listings");
});

app.get("/listings/:id", async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);
    res.render("listings/show.ejs", { listing });
});

app.post("/listings", async (req, res) => {
    console.log("Creating new listing with data:", req.body);
    const newlisting = new Listing(req.body.listing);
    await newlisting.save();
    console.log("Successfully created:", newlisting);
    res.redirect("/listings");
});

app.get("/listings/:id/edit", async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);
    res.render("listings/edit.ejs", { listing });
});

app.put("/listings/:id", async (req, res) => {
    let { id } = req.params;
    await Listing.findByIdAndUpdate(id, { ...req.body.listing });
    res.redirect("/listings");
});

app.get("/testListing", async (req, res) => {
    let sampleListing = new Listing({
        title: "myHome",
        description: "by the back",
        price: 12000,
        location: " Calanguate , Goa",
        country: "India",
    })
    await sampleListing.save();
    console.log("sample saved");
    res.send("successful testing");
});

app.listen(3000, () => {
    console.log("server is listening on http://localhost:3000/");
});