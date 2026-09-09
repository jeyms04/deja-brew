import { auth, db } from "./firebase-config.js";
import {
    collection,
    doc,
    getDoc,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";
import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";

// =====================================================
// ELEMENTS
// =====================================================

const userName = document.getElementById("userName");
const userRole = document.getElementById("userRole");

const totalProducts = document.getElementById("totalProducts");
const lowStock = document.getElementById("lowStock");
const stockInToday = document.getElementById("stockInToday");
const stockOutToday = document.getElementById("stockOutToday");

const transactionsTable =
    document.getElementById("transactionsTable");

const logoutBtn =
    document.getElementById("logoutBtn");


// =====================================================
// DATE HELPER
// =====================================================

function convertDate(value) {

    if (!value) {
        return null;
    }

    // Firestore Timestamp
    if (typeof value.toDate === "function") {
        return value.toDate();
    }

    // JavaScript Date
    if (value instanceof Date) {
        return value;
    }

    // Firestore timestamp-like object
    if (value.seconds) {
        return new Date(value.seconds * 1000);
    }

    // String date
    if (typeof value === "string") {

        const date = new Date(value);

        if (!isNaN(date.getTime())) {
            return date;
        }
    }

    // Number timestamp
    if (typeof value === "number") {
        return new Date(value);
    }

    return null;
}


// =====================================================
// FORMAT DATE
// =====================================================

function formatDate(value) {

    const date = convertDate(value);

    if (!date) {
        return "—";
    }

    return date.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit"
    });
}


// =====================================================
// CHECK IF TODAY
// =====================================================

function isToday(value) {

    const date = convertDate(value);

    if (!date) {
        return false;
    }

    const today = new Date();

    return (
        date.getFullYear() === today.getFullYear() &&
        date.getMonth() === today.getMonth() &&
        date.getDate() === today.getDate()
    );
}


// =====================================================
// ESCAPE HTML
// =====================================================

function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// =====================================================
// LOGIN CHECK
// =====================================================

onAuthStateChanged(auth, async (user) => {

    console.log("Dashboard user:", user);

    if (!user) {

        window.location.href = "login.html";

        return;
    }


    try {

        // =================================================
        // LOAD USER PROFILE
        // =================================================

        const userRef =
            doc(db, "users", user.uid);

        const userSnap =
            await getDoc(userRef);


        if (userSnap.exists()) {

            const userData =
                userSnap.data();

            console.log(
                "Logged in user data:",
                userData
            );


            if (userName) {

                userName.textContent =
                    userData.fullname ||
                    user.email ||
                    "User";
            }


            if (userRole) {

                userRole.textContent =
                    userData.role === "admin"
                        ? "Admin"
                        : "Staff";
            }

        } else {

            if (userName) {
                userName.textContent =
                    user.email || "User";
            }

            if (userRole) {
                userRole.textContent = "Staff";
            }
        }


        // =================================================
        // LOAD DASHBOARD DATA
        // =================================================

        await loadDashboard();


    } catch (error) {

        console.error(
            "DASHBOARD ERROR:",
            error
        );


        if (transactionsTable) {

            transactionsTable.innerHTML = `
                <tr>
                    <td colspan="4"
                        style="
                            text-align:center;
                            padding:30px;
                            color:#8b817b;
                        ">

                        Error loading dashboard data.

                    </td>
                </tr>
            `;
        }
    }

});


// =====================================================
// LOAD DASHBOARD DATA
// =====================================================

async function loadDashboard() {

    console.log("Loading dashboard data...");


    // =================================================
    // LOAD PRODUCTS
    // =================================================

    const productsSnapshot =
        await getDocs(
            collection(db, "products")
        );


    console.log(
        "Products found:",
        productsSnapshot.size
    );


    const products =
        productsSnapshot.docs.map((item) => {

            return {
                id: item.id,
                ...item.data()
            };

        });


    // =================================================
    // LOAD STOCK IN
    // =================================================

    const stockInSnapshot =
        await getDocs(
            collection(db, "stockIn")
        );


    console.log(
        "Stock In records found:",
        stockInSnapshot.size
    );


    const stockIns =
        stockInSnapshot.docs.map((item) => {

            return {
                id: item.id,
                ...item.data()
            };

        });


    // =================================================
    // LOAD STOCK OUT
    // =================================================

    const stockOutSnapshot =
        await getDocs(
            collection(db, "stockOut")
        );


    console.log(
        "Stock Out records found:",
        stockOutSnapshot.size
    );


    const stockOuts =
        stockOutSnapshot.docs.map((item) => {

            return {
                id: item.id,
                ...item.data()
            };

        });


    // =================================================
    // TOTAL PRODUCTS
    // =================================================

    if (totalProducts) {

        totalProducts.textContent =
            products.length;
    }


    // =================================================
    // LOW STOCK
    // =================================================

    const lowStockCount =
        products.filter((product) => {

            const stock =
                Number(product.stock || 0);

            const minimumStock =
                Number(
                    product.minStock ||
                    product.minimumStock ||
                    0
                );


            return (
                stock > 0 &&
                stock <= minimumStock
            );

        }).length;


    if (lowStock) {

        lowStock.textContent =
            lowStockCount;
    }


    // =================================================
    // STOCK IN TODAY
    // =================================================

    const todayStockIn =
        stockIns
            .filter((item) => {

                return isToday(
                    item.createdAt
                );

            })
            .reduce((total, item) => {

                return (
                    total +
                    Number(
                        item.quantity || 0
                    )
                );

            }, 0);


    if (stockInToday) {

        stockInToday.textContent =
            todayStockIn;
    }


    // =================================================
    // STOCK OUT TODAY
    // =================================================

    const todayStockOut =
        stockOuts
            .filter((item) => {

                return isToday(
                    item.date ||
                    item.createdAt
                );

            })
            .reduce((total, item) => {

                return (
                    total +
                    Number(
                        item.quantity || 0
                    )
                );

            }, 0);


    if (stockOutToday) {

        stockOutToday.textContent =
            todayStockOut;
    }


    // =================================================
    // CREATE MOVEMENT LIST
    // =================================================

    const movements = [];


    // =================================================
    // STOCK IN
    // =================================================

    stockIns.forEach((item) => {

        movements.push({

            product:
                item.productName ||
                "Unknown Product",

            type:
                "Stock In",

            quantity:
                Number(
                    item.quantity || 0
                ),

            date:
                item.createdAt

        });

    });


    // =================================================
    // STOCK OUT
    // =================================================

    stockOuts.forEach((item) => {

        movements.push({

            product:
                item.productName ||
                "Unknown Product",

            type:
                "Stock Out",

            quantity:
                Number(
                    item.quantity || 0
                ),

            date:
                item.date ||
                item.createdAt

        });

    });


    // =================================================
    // SORT NEWEST FIRST
    // =================================================

    movements.sort((a, b) => {

        const dateA =
            convertDate(a.date)?.getTime() || 0;

        const dateB =
            convertDate(b.date)?.getTime() || 0;


        return dateB - dateA;

    });


    // =================================================
    // DISPLAY RECENT MOVEMENTS
    // =================================================

    displayMovements(
        movements.slice(0, 5)
    );

}


// =====================================================
// DISPLAY MOVEMENTS
// =====================================================

function displayMovements(movements) {

    if (!transactionsTable) {
        return;
    }


    // =================================================
    // NO MOVEMENTS
    // =================================================

    if (movements.length === 0) {

        transactionsTable.innerHTML = `
            <tr>
                <td colspan="4"
                    style="
                        text-align:center;
                        padding:30px;
                        color:#8b817b;
                    ">

                    No transactions yet.

                </td>
            </tr>
        `;

        return;
    }


    // =================================================
    // SHOW MOVEMENTS
    // =================================================

    transactionsTable.innerHTML =
        movements.map((item) => {

            const isStockIn =
                item.type === "Stock In";


            return `
                <tr>

                    <td>
                        <strong>
                            ${escapeHTML(
                                item.product
                            )}
                        </strong>
                    </td>


                    <td>

                        <span
                            class="status-badge ${
                                isStockIn
                                    ? "status-good"
                                    : "status-low"
                            }">

                            ${item.type}

                        </span>

                    </td>


                    <td>

                        <strong>

                            ${
                                isStockIn
                                    ? "+"
                                    : "-"
                            }${item.quantity}

                        </strong>

                    </td>


                    <td>
                        ${escapeHTML(
                            formatDate(
                                item.date
                            )
                        )}
                    </td>

                </tr>
            `;

        }).join("");

}


// =====================================================
// LOGOUT
// =====================================================

if (logoutBtn) {

    logoutBtn.addEventListener(
        "click",
        async () => {

            try {

                await signOut(auth);

                window.location.href =
                    "login.html";

            } catch (error) {

                console.error(
                    "Logout error:",
                    error
                );

            }

        }
    );

}
