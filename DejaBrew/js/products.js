import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    serverTimestamp,
    setDoc,
    updateDoc
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

const productsTable =
    document.getElementById("productsTable");

const productCount =
    document.getElementById("productCount");

const searchProduct =
    document.getElementById("searchProduct");

const productModal =
    document.getElementById("productModal");

const addProductBtn =
    document.getElementById("addProductBtn");

const closeModalBtn =
    document.getElementById("closeModal");

const cancelProduct =
    document.getElementById("cancelProduct");

const productForm =
    document.getElementById("productForm");

const modalTitle =
    document.getElementById("modalTitle");

const productMessage =
    document.getElementById("productMessage");

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


// ==========================================
// VARIABLES
// ==========================================

let products = [];

let currentUserRole = "staff";

let isSavingProduct = false;


// ==========================================
// AUTHENTICATION
// ==========================================

onAuthStateChanged(auth, async (user) => {

    if (!user) {

        window.location.href =
            "login.html";

        return;
    }


    // Display logged-in user

    userName.textContent =
        user.displayName || user.email;


    try {

        // Get ONLY the current user's document.
        // This works with the secure Firestore rules.

        const userRef =
            doc(
                db,
                "users",
                user.uid
            );


        const userSnapshot =
            await getDoc(userRef);


        if (
            userSnapshot.exists()
        ) {

            const userData =
                userSnapshot.data();


            currentUserRole =
                (
                    userData.role ||
                    "staff"
                ).toLowerCase();

        } else {

            currentUserRole =
                "staff";

        }


        // Display role

        userRole.textContent =
            currentUserRole
                .charAt(0)
                .toUpperCase()
            +
            currentUserRole.slice(1);


        console.log(
            "Logged-in role:",
            currentUserRole
        );


    } catch (error) {

        console.error(
            "User role error:",
            error
        );


        currentUserRole =
            "staff";

        userRole.textContent =
            "Staff";

    }


    // Load products

    await loadProducts();

});


// ==========================================
// LOAD PRODUCTS
// ==========================================

async function loadProducts() {

    try {

        productsTable.innerHTML = `
            <tr>
                <td
                    colspan="7"
                    class="empty-table"
                >
                    Loading products...
                </td>
            </tr>
        `;


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


        displayProducts(
            products
        );


    } catch (error) {

        console.error(
            "Error loading products:",
            error
        );


        productsTable.innerHTML = `
            <tr>
                <td
                    colspan="7"
                    class="empty-table"
                >
                    Unable to load products.
                </td>
            </tr>
        `;

    }

}


// ==========================================
// DISPLAY PRODUCTS
// ==========================================

function displayProducts(
    productList
) {

    productCount.textContent =
        `${productList.length} product${
            productList.length !== 1
                ? "s"
                : ""
        }`;


    if (
        productList.length === 0
    ) {

        productsTable.innerHTML = `
            <tr>
                <td
                    colspan="7"
                    class="empty-table"
                >
                    No products found.
                </td>
            </tr>
        `;

        return;

    }


    productsTable.innerHTML = "";


    productList.forEach(
        (product) => {

            const stock =
                Number(
                    product.stock || 0
                );


            const minStock =
                Number(
                    product.minStock || 0
                );


            // Determine status

            let status = "";

            let statusClass = "";


            if (stock === 0) {

                status =
                    "Out of Stock";

                statusClass =
                    "status-out";

            }

            else if (
                stock <= minStock
            ) {

                status =
                    "Low Stock";

                statusClass =
                    "status-low";

            }

            else {

                status =
                    "In Stock";

                statusClass =
                    "status-good";

            }


            const row =
                document.createElement(
                    "tr"
                );


            // Admin gets Delete.
            // Staff only gets Edit.

            const deleteButton =
                currentUserRole === "admin"
                    ? `
                        <button
                            type="button"
                            class="delete-btn"
                            data-id="${product.id}"
                        >
                            🗑️
                        </button>
                      `
                    : "";


            row.innerHTML = `

                <td>

                    <div class="product-name-cell">

                        <div class="product-icon">
                            ☕
                        </div>

                        <div>

                            <strong>
                                ${escapeHTML(
                                    product.name ||
                                    "Unnamed"
                                )}
                            </strong>

                        </div>

                    </div>

                </td>


                <td>
                    ${escapeHTML(
                        product.sku || "-"
                    )}
                </td>


                <td>
                    ${escapeHTML(
                        product.category || "-"
                    )}
                </td>


                <td>
                    ₱${Number(
                        product.price || 0
                    ).toFixed(2)}
                </td>


                <td>
                    <strong>
                        ${stock}
                    </strong>
                </td>


                <td>

                    <span
                        class="status-badge ${statusClass}"
                    >
                        ${status}
                    </span>

                </td>


                <td>

                    <div class="action-buttons">

                        <button
                            type="button"
                            class="edit-btn"
                            data-id="${product.id}"
                        >
                            ✏️
                        </button>

                        ${deleteButton}

                    </div>

                </td>

            `;


            productsTable.appendChild(
                row
            );

        }
    );


    // ======================================
    // EDIT BUTTONS
    // ======================================

    document
        .querySelectorAll(".edit-btn")
        .forEach(
            (button) => {

                button.addEventListener(
                    "click",
                    () => {

                        editProduct(
                            button.dataset.id
                        );

                    }
                );

            }
        );


    // ======================================
    // DELETE BUTTONS
    // ======================================

    document
        .querySelectorAll(".delete-btn")
        .forEach(
            (button) => {

                button.addEventListener(
                    "click",
                    () => {

                        deleteProduct(
                            button.dataset.id
                        );

                    }
                );

            }
        );

}


// ==========================================
// SEARCH
// ==========================================

searchProduct.addEventListener(
    "input",
    () => {

        const search =
            searchProduct.value
                .toLowerCase()
                .trim();


        if (!search) {

            displayProducts(
                products
            );

            return;

        }


        const filtered =
            products.filter(
                (product) => {

                    return (

                        String(
                            product.name || ""
                        )
                            .toLowerCase()
                            .includes(search)

                        ||

                        String(
                            product.sku || ""
                        )
                            .toLowerCase()
                            .includes(search)

                        ||

                        String(
                            product.category || ""
                        )
                            .toLowerCase()
                            .includes(search)

                    );

                }
            );


        displayProducts(
            filtered
        );

    }
);


// ==========================================
// OPEN ADD PRODUCT MODAL
// ==========================================

addProductBtn.addEventListener(
    "click",
    () => {

        productForm.reset();


        document.getElementById(
            "productId"
        ).value = "";


        modalTitle.textContent =
            "Add Product";


        productMessage.textContent =
            "";


        productMessage.className =
            "form-message";


        productModal.classList.add(
            "active"
        );

    }
);


// ==========================================
// CLOSE PRODUCT MODAL
// ==========================================

function closeProductModal() {

    productModal.classList.remove(
        "active"
    );


    productForm.reset();


    document.getElementById(
        "productId"
    ).value = "";


    productMessage.textContent =
        "";


    productMessage.className =
        "form-message";

}


closeModalBtn.addEventListener(
    "click",
    closeProductModal
);


cancelProduct.addEventListener(
    "click",
    closeProductModal
);


// Click outside modal

productModal.addEventListener(
    "click",
    (event) => {

        if (
            event.target ===
            productModal
        ) {

            closeProductModal();

        }

    }
);


// ==========================================
// SAVE PRODUCT
// ==========================================

productForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();


        // Prevent double click

        if (isSavingProduct) {

            return;

        }


        const id =
            document.getElementById(
                "productId"
            ).value;


        const name =
            document.getElementById(
                "productName"
            ).value.trim();


        const sku =
            document.getElementById(
                "productSKU"
            ).value.trim();


        const category =
            document.getElementById(
                "productCategory"
            ).value.trim();


        const price =
            Number(
                document.getElementById(
                    "productPrice"
                ).value
            );


        const stock =
            Number(
                document.getElementById(
                    "productStock"
                ).value
            );


        const minStock =
            Number(
                document.getElementById(
                    "productMinStock"
                ).value
            );


        // ======================================
        // VALIDATION
        // ======================================

        if (!name) {

            showError(
                "Please enter a product name."
            );

            return;

        }


        if (!sku) {

            showError(
                "Please enter a SKU."
            );

            return;

        }


        if (!category) {

            showError(
                "Please enter a category."
            );

            return;

        }


        if (
            isNaN(price) ||
            price < 0
        ) {

            showError(
                "Please enter a valid price."
            );

            return;

        }


        if (
            isNaN(stock) ||
            stock < 0
        ) {

            showError(
                "Please enter a valid stock."
            );

            return;

        }


        if (
            isNaN(minStock) ||
            minStock < 0
        ) {

            showError(
                "Please enter a valid minimum stock."
            );

            return;

        }


        const productData = {

            name:
                name,

            sku:
                sku,

            category:
                category,

            price:
                price,

            stock:
                stock,

            minStock:
                minStock,

            updatedAt:
                serverTimestamp()

        };


        try {

            isSavingProduct =
                true;


            // Disable submit button

            const submitButton =
                productForm.querySelector(
                    'button[type="submit"]'
                );


            if (submitButton) {

                submitButton.disabled =
                    true;

            }


            // ==================================
            // UPDATE PRODUCT
            // ==================================

            if (id) {

                await updateDoc(

                    doc(
                        db,
                        "products",
                        id
                    ),

                    productData

                );


                showSuccess(
                    "Product updated successfully!"
                );

            }


            // ==================================
            // ADD PRODUCT
            // ==================================

            else {

                await addDoc(

                    collection(
                        db,
                        "products"
                    ),

                    {

                        ...productData,

                        createdAt:
                            serverTimestamp(),

                        createdBy:
                            auth.currentUser
                                ? auth.currentUser.uid
                                : ""

                    }

                );


                showSuccess(
                    "Product added successfully!"
                );

            }


            // Reload products

            await loadProducts();


            // Close modal

            setTimeout(
                () => {

                    closeProductModal();

                },
                700
            );


        } catch (error) {

            console.error(
                "Product save error:",
                error
            );


            showError(
                error.message ||
                "Unable to save product."
            );


        } finally {

            isSavingProduct =
                false;


            const submitButton =
                productForm.querySelector(
                    'button[type="submit"]'
                );


            if (submitButton) {

                submitButton.disabled =
                    false;

            }

        }

    }
);


// ==========================================
// EDIT PRODUCT
// ==========================================

function editProduct(id) {

    const product =
        products.find(
            (item) =>
                item.id === id
        );


    if (!product) {

        return;

    }


    document.getElementById(
        "productId"
    ).value =
        product.id;


    document.getElementById(
        "productName"
    ).value =
        product.name || "";


    document.getElementById(
        "productSKU"
    ).value =
        product.sku || "";


    document.getElementById(
        "productCategory"
    ).value =
        product.category || "";


    document.getElementById(
        "productPrice"
    ).value =
        product.price || 0;


    document.getElementById(
        "productStock"
    ).value =
        product.stock || 0;


    document.getElementById(
        "productMinStock"
    ).value =
        product.minStock || 0;


    modalTitle.textContent =
        "Edit Product";


    productMessage.textContent =
        "";


    productMessage.className =
        "form-message";


    productModal.classList.add(
        "active"
    );

}


// ==========================================
// DELETE PRODUCT
// ==========================================

// ==========================================
// ARCHIVE PRODUCT
// ==========================================

async function deleteProduct(id) {

    // Only Admin can archive products
    if (currentUserRole !== "admin") {

        alert(
            "Only administrators can archive products."
        );

        return;
    }

    // Find product
    const product =
        products.find(
            (item) =>
                item.id === id
        );

    if (!product) {

        alert("Product not found.");

        return;
    }

    // Confirmation
    const confirmed =
        confirm(
            `Are you sure you want to archive "${product.name}"?\n\n` +
            `This product will be moved to the Archive.`
        );

    if (!confirmed) {

        return;
    }

    try {

        // ======================================
        // PRODUCT REFERENCE
        // ======================================

        const productRef =
            doc(
                db,
                "products",
                id
            );


        // ======================================
        // CREATE ARCHIVE DOCUMENT
        // ======================================

        const archiveRef =
            doc(
                collection(
                    db,
                    "archive"
                )
            );


        // Remove the temporary "id" property
        // before saving the original product data.

        const {
            id: ignoredId,
            ...originalData
        } = product;


        // ======================================
        // SAVE PRODUCT TO ARCHIVE
        // ======================================

        await setDoc(
            archiveRef,
            {

                type:
                    "Product",

                originalCollection:
                    "products",

                originalId:
                    id,

                originalData:
                    originalData,

                deletedBy:
                    auth.currentUser
                        ? auth.currentUser.uid
                        : "",

                deletedByEmail:
                    auth.currentUser
                        ? auth.currentUser.email
                        : "",

                deletedAt:
                    serverTimestamp()

            }
        );


        // ======================================
        // DELETE ORIGINAL PRODUCT
        // ======================================

        await deleteDoc(
            productRef
        );


        // ======================================
        // RELOAD PRODUCTS
        // ======================================

        await loadProducts();


        alert(
            "Product moved to Archive successfully!"
        );


    } catch (error) {

        console.error(
            "Archive product error:",
            error
        );

        alert(
            error.message ||
            "Unable to archive product."
        );

    }

}


// ==========================================
// MESSAGE FUNCTIONS
// ==========================================

function showSuccess(message) {

    productMessage.textContent =
        message;

    productMessage.className =
        "form-message success-message";

}


function showError(message) {

    productMessage.textContent =
        message;

    productMessage.className =
        "form-message error-message";

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
