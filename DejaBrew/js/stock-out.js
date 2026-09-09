import { auth, db } from "./firebase-config.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";

import {
    collection,
    getDocs,
    addDoc,
    doc,
    runTransaction,
    query,
    orderBy,
    limit,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";


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

const openStockOutBtn =
    document.getElementById("openStockOutBtn");

const stockOutModal =
    document.getElementById("stockOutModal");

const closeStockOutBtn =
    document.getElementById("closeStockOutBtn");

const cancelStockOutBtn =
    document.getElementById("cancelStockOutBtn");

const stockOutForm =
    document.getElementById("stockOutForm");

const stockOutProduct =
    document.getElementById("stockOutProduct");

const stockOutQuantity =
    document.getElementById("stockOutQuantity");

const stockOutReason =
    document.getElementById("stockOutReason");

const stockOutNotes =
    document.getElementById("stockOutNotes");

const availableStock =
    document.getElementById("availableStock");

const stockOutMessage =
    document.getElementById("stockOutMessage");

const stockOutTable =
    document.getElementById("stockOutTable");

const transactionCount =
    document.getElementById("transactionCount");

const searchStockOut =
    document.getElementById("searchStockOut");


// ==========================================
// VARIABLES
// ==========================================

let currentUser = null;

let stockOutRecords = [];


// ==========================================
// AUTHENTICATION
// ==========================================

onAuthStateChanged(auth, async (user) => {

    if (!user) {

        window.location.href = "login.html";

        return;
    }


    currentUser = user;


    // Display name

    userName.textContent =
        user.displayName || user.email;


    // Get actual role from Firestore

    try {

        const userRef =
            doc(
                db,
                "users",
                user.uid
            );


        const userSnapshot =
            await getDocs(
                query(
                    collection(db, "users")
                )
            );


        let role = "staff";


        userSnapshot.forEach((userDoc) => {

            if (userDoc.id === user.uid) {

                role =
                    userDoc.data().role || "staff";

            }

        });


        userRole.textContent =
            role.charAt(0).toUpperCase()
            + role.slice(1);


    } catch (error) {

        console.error(
            "Unable to load role:",
            error
        );


        userRole.textContent =
            "Staff";

    }


    // Load records

    await loadStockOutRecords();

});


// ==========================================
// OPEN MODAL
// ==========================================

openStockOutBtn.addEventListener(
    "click",
    async () => {

        stockOutForm.reset();

        availableStock.textContent = "0";

        stockOutMessage.textContent = "";

        stockOutMessage.className =
            "form-message";


        await loadProducts();


        stockOutModal.classList.add(
            "active"
        );

    }
);


// ==========================================
// CLOSE MODAL
// ==========================================

function closeModal() {

    stockOutModal.classList.remove(
        "active"
    );

    stockOutForm.reset();

    availableStock.textContent =
        "0";

    stockOutMessage.textContent =
        "";

    stockOutMessage.className =
        "form-message";

}


closeStockOutBtn.addEventListener(
    "click",
    closeModal
);


cancelStockOutBtn.addEventListener(
    "click",
    closeModal
);


// Close modal by clicking outside

stockOutModal.addEventListener(
    "click",
    (event) => {

        if (
            event.target === stockOutModal
        ) {

            closeModal();

        }

    }
);


// ==========================================
// LOAD PRODUCTS
// ==========================================

async function loadProducts() {

    try {

        stockOutProduct.innerHTML = `
            <option value="">
                Select a product
            </option>
        `;


        const snapshot =
            await getDocs(
                collection(
                    db,
                    "products"
                )
            );


        snapshot.forEach(
            (productDoc) => {

                const product =
                    productDoc.data();


                const stock =
                    Number(
                        product.stock
                    ) || 0;


                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    productDoc.id;


                option.textContent =
                    `${product.name || "Unnamed Product"} — Stock: ${stock}`;


                option.dataset.stock =
                    stock;


                stockOutProduct.appendChild(
                    option
                );

            }
        );


    } catch (error) {

        console.error(
            "Unable to load products:",
            error
        );


        showError(
            "Unable to load products."
        );

    }

}


// ==========================================
// PRODUCT SELECTION
// ==========================================

stockOutProduct.addEventListener(
    "change",
    () => {

        const selectedOption =
            stockOutProduct.options[
                stockOutProduct.selectedIndex
            ];


        if (!selectedOption.value) {

            availableStock.textContent =
                "0";

            stockOutQuantity.max =
                "";

            return;

        }


        const stock =
            Number(
                selectedOption.dataset.stock
            ) || 0;


        availableStock.textContent =
            stock;


        stockOutQuantity.max =
            stock;


        // Prevent entering a quantity
        // greater than available stock

        stockOutQuantity.value =
            "";

    }
);


// ==========================================
// QUANTITY VALIDATION
// ==========================================

stockOutQuantity.addEventListener(
    "input",
    () => {

        const max =
            Number(
                stockOutQuantity.max
            );


        const value =
            Number(
                stockOutQuantity.value
            );


        if (
            max > 0 &&
            value > max
        ) {

            stockOutQuantity.value =
                max;

        }

    }
);


// ==========================================
// SAVE STOCK OUT
// ==========================================

stockOutForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();


        if (!currentUser) {

            showError(
                "You must be logged in."
            );

            return;

        }


        const productId =
            stockOutProduct.value;


        const quantity =
            Number(
                stockOutQuantity.value
            );


        const reason =
            stockOutReason.value;


        const notes =
            stockOutNotes.value.trim();


        // ----------------------------------
        // VALIDATION
        // ----------------------------------

        if (!productId) {

            showError(
                "Please select a product."
            );

            return;

        }


        if (
            !Number.isInteger(quantity) ||
            quantity <= 0
        ) {

            showError(
                "Please enter a valid quantity."
            );

            return;

        }


        if (!reason) {

            showError(
                "Please select a reason."
            );

            return;

        }


        try {

            stockOutMessage.textContent =
                "Saving stock out...";


            stockOutMessage.className =
                "form-message";


            // ----------------------------------
            // FIRESTORE TRANSACTION
            // ----------------------------------

            await runTransaction(
                db,
                async (transaction) => {

                    const productRef =
                        doc(
                            db,
                            "products",
                            productId
                        );


                    const productSnapshot =
                        await transaction.get(
                            productRef
                        );


                    if (
                        !productSnapshot.exists()
                    ) {

                        throw new Error(
                            "Product not found."
                        );

                    }


                    const product =
                        productSnapshot.data();


                    const currentStock =
                        Number(
                            product.stock
                        ) || 0;


                    // Check available stock

                    if (
                        quantity >
                        currentStock
                    ) {

                        throw new Error(
                            `Not enough stock. Available stock: ${currentStock}`
                        );

                    }


                    const newStock =
                        currentStock -
                        quantity;


                    // ----------------------------------
                    // UPDATE PRODUCT STOCK
                    // ----------------------------------

                    transaction.update(
                        productRef,
                        {
                            stock: newStock
                        }
                    );


                    // ----------------------------------
                    // CREATE TRANSACTION
                    // ----------------------------------

                    const transactionRef =
                        doc(
                            collection(
                                db,
                                "stockOut"
                            )
                        );


                    transaction.set(
                        transactionRef,
                        {

                            productId:
                                productId,

                            productName:
                                product.name || "",

                            sku:
                                product.sku || "",

                            quantity:
                                quantity,

                            reason:
                                reason,

                            notes:
                                notes,

                            previousStock:
                                currentStock,

                            newStock:
                                newStock,

                            userId:
                                currentUser.uid,

                            userEmail:
                                currentUser.email,

                            date:
                                serverTimestamp()

                        }
                    );

                }
            );


            // ----------------------------------
            // SUCCESS
            // ----------------------------------

            showSuccess(
                "Stock Out recorded successfully!"
            );


            await loadStockOutRecords();


            // Reset form

            stockOutForm.reset();

            availableStock.textContent =
                "0";


            // Close after short delay

            setTimeout(
                () => {

                    closeModal();

                },
                900
            );


        } catch (error) {

            console.error(
                "STOCK OUT ERROR:",
                error
            );


            showError(
                error.message ||
                "Unable to save stock out."
            );

        }

    }
);


// ==========================================
// LOAD STOCK OUT RECORDS
// ==========================================

async function loadStockOutRecords() {

    try {

        stockOutTable.innerHTML = `
            <tr>
                <td
                    colspan="6"
                    class="empty-table"
                >
                    Loading records...
                </td>
            </tr>
        `;


        const stockOutQuery =
            query(
                collection(
                    db,
                    "stockOut"
                ),
                orderBy(
                    "date",
                    "desc"
                ),
                limit(100)
            );


        const snapshot =
            await getDocs(
                stockOutQuery
            );


        stockOutRecords = [];


        snapshot.forEach(
            (transactionDoc) => {

                stockOutRecords.push({
                    id:
                        transactionDoc.id,

                    ...transactionDoc.data()
                });

            }
        );


        displayStockOutRecords(
            stockOutRecords
        );


    } catch (error) {

        console.error(
            "Unable to load stock out records:",
            error
        );


        stockOutTable.innerHTML = `
            <tr>
                <td
                    colspan="6"
                    class="empty-table"
                >
                    Unable to load records.
                </td>
            </tr>
        `;

    }

}


// ==========================================
// DISPLAY RECORDS
// ==========================================

function displayStockOutRecords(
    records
) {

    stockOutTable.innerHTML = "";


    transactionCount.textContent =
        `${records.length} transaction${
            records.length === 1
                ? ""
                : "s"
        }`;


    if (records.length === 0) {

        stockOutTable.innerHTML = `
            <tr>
                <td
                    colspan="6"
                    class="empty-table"
                >
                    No stock out transactions yet.
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


            // DATE

            let dateText =
                "—";


            if (record.date) {

                const date =
                    record.date.toDate
                        ? record.date.toDate()
                        : new Date(
                            record.date
                        );


                dateText =
                    date.toLocaleDateString(
                        "en-PH",
                        {
                            year:
                                "numeric",

                            month:
                                "short",

                            day:
                                "numeric"
                        }
                    );

            }


            row.innerHTML = `

                <td>
                    <strong>
                        ${escapeHTML(
                            record.productName || "—"
                        )}
                    </strong>
                </td>

                <td>
                    ${escapeHTML(
                        record.sku || "—"
                    )}
                </td>

                <td>
                    <strong>
                        ${record.quantity || 0}
                    </strong>
                </td>

                <td>
                    ${escapeHTML(
                        record.reason || "—"
                    )}
                </td>

                <td>
                    ${dateText}
                </td>

                <td>
                    ${escapeHTML(
                        record.userEmail || "—"
                    )}
                </td>

            `;


            stockOutTable.appendChild(
                row
            );

        }
    );

}


// ==========================================
// SEARCH
// ==========================================

searchStockOut.addEventListener(
    "input",
    () => {

        const search =
            searchStockOut.value
                .toLowerCase()
                .trim();


        if (!search) {

            displayStockOutRecords(
                stockOutRecords
            );

            return;

        }


        const filtered =
            stockOutRecords.filter(
                (record) => {

                    return (

                        (
                            record.productName ||
                            ""
                        )
                        .toLowerCase()
                        .includes(search)

                        ||

                        (
                            record.sku ||
                            ""
                        )
                        .toLowerCase()
                        .includes(search)

                        ||

                        (
                            record.reason ||
                            ""
                        )
                        .toLowerCase()
                        .includes(search)

                        ||

                        (
                            record.userEmail ||
                            ""
                        )
                        .toLowerCase()
                        .includes(search)

                    );

                }
            );


        displayStockOutRecords(
            filtered
        );

    }
);


// ==========================================
// SUCCESS MESSAGE
// ==========================================

function showSuccess(text) {

    stockOutMessage.textContent =
        text;

    stockOutMessage.className =
        "form-message success-message";

}


// ==========================================
// ERROR MESSAGE
// ==========================================

function showError(text) {

    stockOutMessage.textContent =
        text;

    stockOutMessage.className =
        "form-message error-message";

}


// ==========================================
// HTML SECURITY
// ==========================================

function escapeHTML(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
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