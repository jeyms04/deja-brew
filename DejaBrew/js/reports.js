import {
    collection,
    getDocs,
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

import {
    auth,
    db
} from "./firebase-config.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";


// ==========================================
// ELEMENTS
// ==========================================

const userName =
    document.getElementById("userName");

const userRole =
    document.getElementById("userRole");

const logoutBtn =
    document.getElementById("logoutBtn");

const menuBtn =
    document.getElementById("menuBtn");

const sidebar =
    document.getElementById("sidebar");

const sidebarOverlay =
    document.getElementById("sidebarOverlay");

const totalProducts =
    document.getElementById("totalProducts");

const totalStock =
    document.getElementById("totalStock");

const lowStock =
    document.getElementById("lowStock");

const outOfStock =
    document.getElementById("outOfStock");

const totalStockIn =
    document.getElementById("totalStockIn");

const totalStockOut =
    document.getElementById("totalStockOut");

const reportTable =
    document.getElementById("reportTable");

const activityCount =
    document.getElementById("activityCount");

const searchReport =
    document.getElementById("searchReport");

const reportFilter =
    document.getElementById("reportFilter");

const printReportBtn =
    document.getElementById("printReportBtn");


// ==========================================
// VARIABLES
// ==========================================

let currentUser = null;

let currentRole = "staff";

let products = [];

let activities = [];


// ==========================================
// AUTHENTICATION
// ==========================================

onAuthStateChanged(auth, async (user) => {

    if (!user) {

        window.location.href =
            "login.html";

        return;

    }


    currentUser = user;


    userName.textContent =
        user.displayName || user.email;


    try {

        // Get only the logged-in user's document

        const userRef =
            doc(
                db,
                "users",
                user.uid
            );


        const userSnapshot =
            await getDoc(userRef);


        if (userSnapshot.exists()) {

            const userData =
                userSnapshot.data();


            currentRole =
                (
                    userData.role ||
                    "staff"
                ).toLowerCase();

        } else {

            currentRole =
                "staff";

        }


        userRole.textContent =
            capitalize(currentRole);


    } catch (error) {

        console.error(
            "User role error:",
            error
        );


        currentRole =
            "staff";

        userRole.textContent =
            "Staff";

    }


    // Load report data

    await loadReports();

});


// ==========================================
// LOAD ALL REPORT DATA
// ==========================================

async function loadReports() {

    try {

        // --------------------------------------
        // LOAD PRODUCTS
        // --------------------------------------

        const productSnapshot =
            await getDocs(
                collection(
                    db,
                    "products"
                )
            );


        products = [];


        productSnapshot.forEach(
            (productDoc) => {

                products.push({

                    id:
                        productDoc.id,

                    ...productDoc.data()

                });

            }
        );


        // --------------------------------------
        // LOAD STOCK IN
        // --------------------------------------

        const stockInSnapshot =
            await getDocs(
                collection(
                    db,
                    "stockIn"
                )
            );


        const stockInRecords = [];


        stockInSnapshot.forEach(
            (stockDoc) => {

                stockInRecords.push({

                    id:
                        stockDoc.id,

                    ...stockDoc.data(),

                    type:
                        "stockIn"

                });

            }
        );


        // --------------------------------------
        // LOAD STOCK OUT
        // --------------------------------------

        const stockOutSnapshot =
            await getDocs(
                collection(
                    db,
                    "stockOut"
                )
            );


        const stockOutRecords = [];


        stockOutSnapshot.forEach(
            (stockDoc) => {

                stockOutRecords.push({

                    id:
                        stockDoc.id,

                    ...stockDoc.data(),

                    type:
                        "stockOut"

                });

            }
        );


        // Combine activities

        activities = [

            ...stockInRecords,

            ...stockOutRecords

        ];


        // Sort newest first

        activities.sort(
            (a, b) => {

                return (
                    getDateValue(b) -
                    getDateValue(a)
                );

            }
        );


        // Update summary

        updateSummary(
            stockInRecords,
            stockOutRecords
        );


        // Display activity

        displayActivities(
            activities
        );


    } catch (error) {

        console.error(
            "REPORT ERROR:",
            error
        );


        reportTable.innerHTML = `
            <tr>
                <td
                    colspan="7"
                    class="empty-table"
                >
                    Unable to load report.
                </td>
            </tr>
        `;

    }

}


// ==========================================
// UPDATE SUMMARY
// ==========================================

function updateSummary(
    stockInRecords,
    stockOutRecords
) {

    // --------------------------------------
    // TOTAL PRODUCTS
    // --------------------------------------

    totalProducts.textContent =
        products.length;


    // --------------------------------------
    // TOTAL CURRENT STOCK
    // --------------------------------------

    let stockTotal = 0;

    let lowStockCount = 0;

    let outOfStockCount = 0;


    products.forEach(
        (product) => {

            const stock =
                Number(
                    product.stock || 0
                );


            const minimum =
                Number(
                    product.minStock || 0
                );


            stockTotal +=
                stock;


            if (stock === 0) {

                outOfStockCount++;

            }

            else if (
                stock <= minimum
            ) {

                lowStockCount++;

            }

        }
    );


    totalStock.textContent =
        stockTotal;


    lowStock.textContent =
        lowStockCount;


    outOfStock.textContent =
        outOfStockCount;


    // --------------------------------------
    // STOCK IN TOTAL
    // --------------------------------------

    let stockInTotal = 0;


    stockInRecords.forEach(
        (record) => {

            stockInTotal +=
                Number(
                    record.quantity || 0
                );

        }
    );


    totalStockIn.textContent =
        stockInTotal;


    // --------------------------------------
    // STOCK OUT TOTAL
    // --------------------------------------

    let stockOutTotal = 0;


    stockOutRecords.forEach(
        (record) => {

            stockOutTotal +=
                Number(
                    record.quantity || 0
                );

        }
    );


    totalStockOut.textContent =
        stockOutTotal;

}


// ==========================================
// DISPLAY ACTIVITIES
// ==========================================

function displayActivities(
    records
) {

    reportTable.innerHTML = "";


    activityCount.textContent =
        `${records.length} activit${
            records.length === 1
                ? "y"
                : "ies"
        }`;


    if (
        records.length === 0
    ) {

        reportTable.innerHTML = `
            <tr>
                <td
                    colspan="7"
                    class="empty-table"
                >
                    No inventory activity yet.
                </td>
            </tr>
        `;

        return;

    }


    records.forEach(
        (record) => {

            const row =
                document.createElement(
                    "tr"
                );


            // ----------------------------------
            // DATE
            // ----------------------------------

            const date =
                getRecordDate(record);


            const dateText =
                date
                    ? date.toLocaleDateString(
                        "en-PH",
                        {
                            year:
                                "numeric",

                            month:
                                "short",

                            day:
                                "numeric"
                        }
                    )
                    : "—";


            // ----------------------------------
            // TYPE
            // ----------------------------------

            const isStockIn =
                record.type ===
                "stockIn";


            const typeText =
                isStockIn
                    ? "Stock In"
                    : "Stock Out";


            const typeClass =
                isStockIn
                    ? "status-good"
                    : "status-low";


            // ----------------------------------
            // STOCK VALUES
            // ----------------------------------

            let previousStock = "—";

            let newStock = "—";


            if (
                record.previousStock !==
                undefined
            ) {

                previousStock =
                    record.previousStock;

            }


            if (
                record.newStock !==
                undefined
            ) {

                newStock =
                    record.newStock;

            }


            // Stock In uses newStock
            // or calculates it if necessary

            if (
                isStockIn &&
                record.newStock ===
                undefined &&
                record.previousStock !==
                undefined
            ) {

                newStock =
                    Number(
                        record.previousStock
                    ) +
                    Number(
                        record.quantity || 0
                    );

            }


            // ----------------------------------
            // USER
            // ----------------------------------

            const user =
                record.receivedByName ||
                record.receivedBy ||
                record.userEmail ||
                "—";


            row.innerHTML = `

                <td>
                    ${dateText}
                </td>


                <td>

                    <strong>
                        ${escapeHTML(
                            record.productName ||
                            "Unknown Product"
                        )}
                    </strong>

                </td>


                <td>

                    <span
                        class="status-badge ${typeClass}"
                    >
                        ${typeText}
                    </span>

                </td>


                <td>

                    <strong>
                        ${Number(
                            record.quantity || 0
                        )}
                    </strong>

                </td>


                <td>
                    ${previousStock}
                </td>


                <td>
                    ${newStock}
                </td>


                <td>
                    ${escapeHTML(user)}
                </td>

            `;


            reportTable.appendChild(
                row
            );

        }
    );

}


// ==========================================
// SEARCH + FILTER
// ==========================================

function filterActivities() {

    const search =
        searchReport.value
            .toLowerCase()
            .trim();


    const filter =
        reportFilter.value;


    const filtered =
        activities.filter(
            (record) => {

                // ------------------------------
                // TYPE FILTER
                // ------------------------------

                if (
                    filter !== "all" &&
                    record.type !== filter
                ) {

                    return false;

                }


                // ------------------------------
                // SEARCH
                // ------------------------------

                if (!search) {

                    return true;

                }


                const productName =
                    String(
                        record.productName ||
                        ""
                    ).toLowerCase();


                const sku =
                    String(
                        record.sku ||
                        ""
                    ).toLowerCase();


                const user =
                    String(
                        record.userEmail ||
                        record.receivedBy ||
                        ""
                    ).toLowerCase();


                return (

                    productName.includes(
                        search
                    )

                    ||

                    sku.includes(
                        search
                    )

                    ||

                    user.includes(
                        search
                    )

                );

            }
        );


    displayActivities(
        filtered
    );

}


searchReport.addEventListener(
    "input",
    filterActivities
);


reportFilter.addEventListener(
    "change",
    filterActivities
);


// ==========================================
// PRINT REPORT
// ==========================================

printReportBtn.addEventListener(
    "click",
    () => {

        window.print();

    }
);


// ==========================================
// DATE HELPERS
// ==========================================

function getRecordDate(record) {

    if (!record) {

        return null;

    }


    // Firestore Timestamp

    if (
        record.date &&
        typeof record.date.toDate ===
            "function"
    ) {

        return record.date.toDate();

    }


    if (
        record.createdAt &&
        typeof record.createdAt.toDate ===
            "function"
    ) {

        return record.createdAt.toDate();

    }


    if (
        record.updatedAt &&
        typeof record.updatedAt.toDate ===
            "function"
    ) {

        return record.updatedAt.toDate();

    }


    return null;

}


function getDateValue(record) {

    const date =
        getRecordDate(record);


    return date
        ? date.getTime()
        : 0;

}


// ==========================================
// CAPITALIZE
// ==========================================

function capitalize(value) {

    if (!value) {

        return "";

    }


    return (
        value.charAt(0).toUpperCase() +
        value.slice(1)
    );

}


// ==========================================
// HTML SECURITY
// ==========================================

function escapeHTML(value) {

    return String(value)

        .replaceAll(
            "&",
            "&amp;"
        )

        .replaceAll(
            "<",
            "&lt;"
        )

        .replaceAll(
            ">",
            "&gt;"
        )

        .replaceAll(
            '"',
            "&quot;"
        )

        .replaceAll(
            "'",
            "&#039;"
        );

}


// ==========================================
// LOGOUT
// ==========================================

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


// ==========================================
// MOBILE SIDEBAR
// ==========================================

menuBtn.addEventListener(
    "click",
    () => {

        sidebar.classList.toggle(
            "active"
        );

        sidebarOverlay.classList.toggle(
            "active"
        );

    }
);


sidebarOverlay.addEventListener(
    "click",
    () => {

        sidebar.classList.remove(
            "active"
        );

        sidebarOverlay.classList.remove(
            "active"
        );

    }
);