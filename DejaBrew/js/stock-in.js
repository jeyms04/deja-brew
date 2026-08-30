import {
    addDoc,
    collection,
    doc,
    getDocs,
    serverTimestamp,
    updateDoc
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";
import { auth, db } from "./firebase-config.js";
import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";

// ==========================================
// ELEMENTS
// ==========================================

const stockInTable =
    document.getElementById("stockInTable");

const stockInCount =
    document.getElementById("stockInCount");

const searchStockIn =
    document.getElementById("searchStockIn");

const stockInModal =
    document.getElementById("stockInModal");

const addStockInBtn =
    document.getElementById("addStockInBtn");

const closeStockInModal =
    document.getElementById("closeStockInModal");

const cancelStockIn =
    document.getElementById("cancelStockIn");

const stockInForm =
    document.getElementById("stockInForm");

const stockInProduct =
    document.getElementById("stockInProduct");

const stockInQuantity =
    document.getElementById("stockInQuantity");

const stockInSupplier =
    document.getElementById("stockInSupplier");

const stockInNotes =
    document.getElementById("stockInNotes");

const stockInMessage =
    document.getElementById("stockInMessage");

const todayStockIn =
    document.getElementById("todayStockIn");

const itemsReceived =
    document.getElementById("itemsReceived");


// ==========================================
// DATA
// ==========================================

let products = [];
let stockInRecords = [];

let isSavingStockIn = false;


// ==========================================
// AUTHENTICATION
// ==========================================

onAuthStateChanged(auth, async (user) => {

    if (!user) {

        window.location.href =
            "login.html";

        return;
    }


    document.getElementById(
        "userName"
    ).textContent =
        user.displayName || user.email;


    // Get role
    try {

        const userSnapshot =
            await getDocs(
                collection(
                    db,
                    "users"
                )
            );


        userSnapshot.forEach(
            (userDoc) => {

                if (
                    userDoc.id === user.uid
                ) {

                    const role =
                        userDoc.data().role
                        || "staff";


                    document.getElementById(
                        "userRole"
                    ).textContent =
                        role
                            .charAt(0)
                            .toUpperCase()
                        +
                        role.slice(1);

                }

            }
        );

    } catch (error) {

        console.error(
            "Role error:",
            error
        );

    }


    await loadProducts();

    await loadStockInRecords();

});


// ==========================================
// LOAD PRODUCTS
// ==========================================

async function loadProducts() {

    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "products"
                )
            );


        products = [];


        snapshot.forEach(
            (productDoc) => {

                products.push({

                    id:
                        productDoc.id,

                    ...productDoc.data()

                });

            }
        );


        populateProductSelect();

    } catch (error) {

        console.error(
            "Product loading error:",
            error
        );

    }

}


// ==========================================
// POPULATE PRODUCT SELECT
// ==========================================

function populateProductSelect() {

    stockInProduct.innerHTML = `

        <option value="">
            Select a product
        </option>

    `;


    products.forEach(
        (product) => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                product.id;


            option.textContent =
                `${product.name} — Stock: ${product.stock || 0}`;


            stockInProduct.appendChild(
                option
            );

        }
    );

}


// ==========================================
// LOAD STOCK IN RECORDS
// ==========================================

async function loadStockInRecords() {

    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "stockIn"
                )
            );


        stockInRecords = [];


        snapshot.forEach(
            (stockDoc) => {

                stockInRecords.push({

                    id:
                        stockDoc.id,

                    ...stockDoc.data()

                });

            }
        );


        // Newest first
        stockInRecords.sort(
            (a, b) => {

                const dateA =
                    a.createdAt?.toDate
                        ? a.createdAt.toDate()
                        : new Date(0);


                const dateB =
                    b.createdAt?.toDate
                        ? b.createdAt.toDate()
                        : new Date(0);


                return dateB - dateA;

            }
        );


        displayStockInRecords(
            stockInRecords
        );


        updateSummary();

    } catch (error) {

        console.error(
            "Stock In loading error:",
            error
        );


        stockInTable.innerHTML = `

            <tr>

                <td
                    colspan="6"
                    class="empty-table"
                >
                    Unable to load stock-in records.
                </td>

            </tr>

        `;

    }

}


// ==========================================
// DISPLAY RECORDS
// ==========================================

function displayStockInRecords(
    records
) {

    stockInCount.textContent =
        `${records.length} record${records.length !== 1 ? "s" : ""}`;


    if (records.length === 0) {

        stockInTable.innerHTML = `

            <tr>

                <td
                    colspan="6"
                    class="empty-table"
                >
                    No stock-in records found.
                </td>

            </tr>

        `;

        return;

    }


    stockInTable.innerHTML = "";


    records.forEach(
        (record) => {

            const row =
                document.createElement(
                    "tr"
                );


            const date =
                record.createdAt?.toDate
                    ? record.createdAt
                        .toDate()
                        .toLocaleString()
                    : "Unknown";


            row.innerHTML = `

                <td>
                    ${escapeHTML(date)}
                </td>


                <td>

                    <div
                        class="product-name-cell"
                    >

                        <div
                            class="product-icon"
                        >
                            📦
                        </div>

                        <strong>
                            ${escapeHTML(
                                record.productName ||
                                "Unknown"
                            )}
                        </strong>

                    </div>

                </td>


                <td>

                    <span
                        class="status-badge status-good"
                    >
                        +${Number(
                            record.quantity || 0
                        )}
                    </span>

                </td>


                <td>
                    ${escapeHTML(
                        record.supplier ||
                        "-"
                    )}
                </td>


                <td>
                    ${Number(
                        record.previousStock ||
                        0
                    )}
                </td>


                <td>
                    <strong>
                        ${Number(
                            record.newStock ||
                            0
                        )}
                    </strong>
                </td>

            `;


            stockInTable.appendChild(
                row
            );

        }
    );

}


// ==========================================
// UPDATE SUMMARY
// ==========================================

function updateSummary() {

    const today =
        new Date();


    const todayStart =
        new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate()
        );


    const tomorrowStart =
        new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate() + 1
        );


    let todayRecords = [];


    stockInRecords.forEach(
        (record) => {

            if (!record.createdAt?.toDate) {

                return;

            }


            const date =
                record.createdAt.toDate();


            if (
                date >= todayStart
                &&
                date < tomorrowStart
            ) {

                todayRecords.push(
                    record
                );

            }

        }
    );


    todayStockIn.textContent =
        todayRecords.length;


    const totalItems =
        todayRecords.reduce(
            (total, record) => {

                return total +
                    Number(
                        record.quantity || 0
                    );

            },
            0
        );


    itemsReceived.textContent =
        totalItems;

}


// ==========================================
// SEARCH
// ==========================================

searchStockIn.addEventListener(
    "input",
    () => {

        const search =
            searchStockIn.value
                .toLowerCase()
                .trim();


        const filtered =
            stockInRecords.filter(
                (record) => {

                    return (

                        String(
                            record.productName ||
                            ""
                        )
                        .toLowerCase()
                        .includes(search)

                        ||

                        String(
                            record.supplier ||
                            ""
                        )
                        .toLowerCase()
                        .includes(search)

                        ||

                        String(
                            record.notes ||
                            ""
                        )
                        .toLowerCase()
                        .includes(search)

                    );

                }
            );


        displayStockInRecords(
            filtered
        );

    }
);


// ==========================================
// OPEN MODAL
// ==========================================

addStockInBtn.addEventListener(
    "click",
    (event) => {

        event.preventDefault();


        stockInForm.reset();


        stockInMessage.textContent = "";

        stockInMessage.className =
            "form-message";


        stockInModal.classList.add(
            "active"
        );

    }
);


// ==========================================
// CLOSE MODAL
// ==========================================

function closeModal() {

    stockInModal.classList.remove(
        "active"
    );


    stockInForm.reset();


    stockInMessage.textContent = "";

    stockInMessage.className =
        "form-message";


    const saveButton =
        stockInForm.querySelector(
            'button[type="submit"]'
        );


    if (saveButton) {

        saveButton.disabled =
            false;

        saveButton.textContent =
            "Save Stock In";

    }


    isSavingStockIn = false;

}


// X
closeStockInModal.addEventListener(
    "click",
    (event) => {

        event.preventDefault();

        event.stopPropagation();

        closeModal();

    }
);


// Cancel
cancelStockIn.addEventListener(
    "click",
    (event) => {

        event.preventDefault();

        event.stopPropagation();

        closeModal();

    }
);


// Outside click
stockInModal.addEventListener(
    "click",
    (event) => {

        if (
            event.target ===
            stockInModal
        ) {

            closeModal();

        }

    }
);


// Escape
document.addEventListener(
    "keydown",
    (event) => {

        if (
            event.key === "Escape"
            &&
            stockInModal.classList.contains(
                "active"
            )
        ) {

            closeModal();

        }

    }
);


// ==========================================
// SAVE STOCK IN
// ==========================================

stockInForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();


        // Prevent double click
        if (isSavingStockIn) {

            return;

        }


        isSavingStockIn = true;


        const saveButton =
            stockInForm.querySelector(
                'button[type="submit"]'
            );


        saveButton.disabled =
            true;


        saveButton.textContent =
            "Saving...";


        // ======================================
        // GET VALUES
        // ======================================

        const productId =
            stockInProduct.value;


        const quantity =
            Number(
                stockInQuantity.value
            );


        const supplier =
            stockInSupplier.value
                .trim();


        const notes =
            stockInNotes.value
                .trim();


        // ======================================
        // VALIDATE
        // ======================================

        if (!productId) {

            showError(
                "Please select a product."
            );

            resetSaveButton();

            return;

        }


        if (
            !Number.isInteger(quantity)
            ||
            quantity <= 0
        ) {

            showError(
                "Quantity must be at least 1."
            );

            resetSaveButton();

            return;

        }


        // ======================================
        // FIND PRODUCT
        // ======================================

        const product =
            products.find(
                (item) =>
                    item.id === productId
            );


        if (!product) {

            showError(
                "Product not found."
            );

            resetSaveButton();

            return;

        }


        const previousStock =
            Number(
                product.stock || 0
            );


        const newStock =
            previousStock + quantity;


        try {

            // ==================================
            // UPDATE PRODUCT STOCK
            // ==================================

            await updateDoc(

                doc(
                    db,
                    "products",
                    productId
                ),

                {

                    stock:
                        newStock,

                    updatedAt:
                        serverTimestamp()

                }

            );


            // ==================================
            // CREATE STOCK IN RECORD
            // ==================================

            await addDoc(

                collection(
                    db,
                    "stockIn"
                ),

                {

                    productId:
                        productId,

                    productName:
                        product.name,

                    quantity:
                        quantity,

                    previousStock:
                        previousStock,

                    newStock:
                        newStock,

                    supplier:
                        supplier,

                    notes:
                        notes,

                    receivedBy:
                        auth.currentUser
                            ?.uid || null,

                    receivedByName:
                        auth.currentUser
                            ?.displayName
                        ||
                        auth.currentUser
                            ?.email
                        ||
                        "Unknown",

                    createdAt:
                        serverTimestamp()

                }

            );


            // ==================================
            // SUCCESS
            // ==================================

            stockInMessage.textContent =
                `Stock In successful! ${product.name} now has ${newStock} items.`;

            stockInMessage.className =
                "form-message success-message";


            // Reload everything
            await loadProducts();

            await loadStockInRecords();


            // Close modal
            closeModal();


        } catch (error) {

            console.error(
                "Stock In error:",
                error
            );


            showError(
                "Unable to record stock in. Please try again."
            );


            resetSaveButton();

        }

    }
);


// ==========================================
// ERROR MESSAGE
// ==========================================

function showError(message) {

    stockInMessage.textContent =
        message;

    stockInMessage.className =
        "form-message error-message";

}


// ==========================================
// RESET SAVE BUTTON
// ==========================================

function resetSaveButton() {

    const saveButton =
        stockInForm.querySelector(
            'button[type="submit"]'
        );


    saveButton.disabled =
        false;


    saveButton.textContent =
        "Save Stock In";


    isSavingStockIn = false;

}


// ==========================================
// ESCAPE HTML
// ==========================================

function escapeHTML(value) {

    return String(value)

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}


// ==========================================
// LOGOUT
// ==========================================

document
    .getElementById("logoutBtn")
    .addEventListener(
        "click",
        async (event) => {

            event.preventDefault();


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

const menuBtn =
    document.getElementById("menuBtn");

const sidebar =
    document.getElementById("sidebar");

const sidebarOverlay =
    document.getElementById(
        "sidebarOverlay"
    );


if (
    menuBtn
    &&
    sidebar
    &&
    sidebarOverlay
) {

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

}