import {
    addDoc,
    collection,
    deleteDoc,
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

const closeModal =
    document.getElementById("closeModal");

const cancelProduct =
    document.getElementById("cancelProduct");

const productForm =
    document.getElementById("productForm");

const modalTitle =
    document.getElementById("modalTitle");

const productMessage =
    document.getElementById("productMessage");


let products = [];


// ==========================================
// AUTHENTICATION
// ==========================================

onAuthStateChanged(auth, async (user) => {

    if (!user) {

        window.location.href = "login.html";

        return;
    }


    document.getElementById("userName").textContent =
        user.displayName || user.email;


    try {

        const userSnapshot =
            await getDocs(
                collection(db, "users")
            );

        userSnapshot.forEach((userDoc) => {

            if (userDoc.id === user.uid) {

                const role =
                    userDoc.data().role || "staff";

                document.getElementById("userRole")
                    .textContent =
                    role.charAt(0).toUpperCase()
                    + role.slice(1);

            }

        });

    } catch (error) {

        console.error(
            "User role error:",
            error
        );

    }


    loadProducts();

});


// ==========================================
// LOAD PRODUCTS
// ==========================================

async function loadProducts() {

    try {

        const snapshot =
            await getDocs(
                collection(db, "products")
            );


        products = [];


        snapshot.forEach((productDoc) => {

            products.push({

                id: productDoc.id,

                ...productDoc.data()

            });

        });


        displayProducts(products);

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

function displayProducts(productList) {

    productCount.textContent =
        `${productList.length} product${productList.length !== 1 ? "s" : ""}`;


    if (productList.length === 0) {

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


    productList.forEach((product) => {

        const stock =
            Number(product.stock || 0);

        const minStock =
            Number(product.minStock || 0);


        let status = "";
        let statusClass = "";


        if (stock === 0) {

            status = "Out of Stock";
            statusClass = "status-out";

        }

        else if (stock <= minStock) {

            status = "Low Stock";
            statusClass = "status-low";

        }

        else {

            status = "In Stock";
            statusClass = "status-good";

        }


        const row =
            document.createElement("tr");


        row.innerHTML = `

            <td>

                <div class="product-name-cell">

                    <div class="product-icon">
                        ☕
                    </div>

                    <div>

                        <strong>
                            ${escapeHTML(product.name || "Unnamed")}
                        </strong>

                    </div>

                </div>

            </td>


            <td>
                ${escapeHTML(product.sku || "-")}
            </td>


            <td>
                ${escapeHTML(product.category || "-")}
            </td>


            <td>
                ₱${Number(product.price || 0).toFixed(2)}
            </td>


            <td>
                <strong>${stock}</strong>
            </td>


            <td>

                <span class="status-badge ${statusClass}">
                    ${status}
                </span>

            </td>


            <td>

                <div class="action-buttons">

                    <button
                        class="edit-btn"
                        data-id="${product.id}"
                    >
                        ✏️
                    </button>

                    <button
                        class="delete-btn"
                        data-id="${product.id}"
                    >
                        🗑️
                    </button>

                </div>

            </td>

        `;


        productsTable.appendChild(row);

    });


    // Edit buttons
    document
        .querySelectorAll(".edit-btn")
        .forEach((button) => {

            button.addEventListener(
                "click",
                () => {

                    editProduct(
                        button.dataset.id
                    );

                }
            );

        });


    // Delete buttons
    document
        .querySelectorAll(".delete-btn")
        .forEach((button) => {

            button.addEventListener(
                "click",
                () => {

                    deleteProduct(
                        button.dataset.id
                    );

                }
            );

        });

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


        const filtered =
            products.filter((product) => {

                return (

                    String(product.name || "")
                        .toLowerCase()
                        .includes(search)

                    ||

                    String(product.sku || "")
                        .toLowerCase()
                        .includes(search)

                    ||

                    String(product.category || "")
                        .toLowerCase()
                        .includes(search)

                );

            });


        displayProducts(filtered);

    }
);


// ==========================================
// OPEN ADD MODAL
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

        productMessage.textContent = "";

        productModal.classList.add("active");

    }
);


// ==========================================
// CLOSE MODAL
// ==========================================

function closeProductModal() {

    productModal.classList.remove(
        "active"
    );

}


closeModal.addEventListener(
    "click",
    closeProductModal
);


cancelProduct.addEventListener(
    "click",
    closeProductModal
);


productModal.addEventListener(
    "click",
    (event) => {

        if (
            event.target === productModal
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


        const id =
            document.getElementById(
                "productId"
            ).value;


        const productData = {

            name:
                document.getElementById(
                    "productName"
                ).value.trim(),

            sku:
                document.getElementById(
                    "productSKU"
                ).value.trim(),

            category:
                document.getElementById(
                    "productCategory"
                ).value.trim(),

            price:
                Number(
                    document.getElementById(
                        "productPrice"
                    ).value
                ),

            stock:
                Number(
                    document.getElementById(
                        "productStock"
                    ).value
                ),

            minStock:
                Number(
                    document.getElementById(
                        "productMinStock"
                    ).value
                ),

            updatedAt:
                serverTimestamp()

        };


        try {

            if (id) {

                // UPDATE
                await updateDoc(
                    doc(
                        db,
                        "products",
                        id
                    ),
                    productData
                );


                productMessage.textContent =
                    "Product updated successfully!";

            }

            else {

                // CREATE
                await addDoc(
                    collection(
                        db,
                        "products"
                    ),
                    {

                        ...productData,

                        createdAt:
                            serverTimestamp()

                    }
                );


                productMessage.textContent =
                    "Product added successfully!";

            }


            await loadProducts();


            setTimeout(() => {

                closeProductModal();

            }, 700);


        } catch (error) {

            console.error(
                "Product save error:",
                error
            );


            productMessage.textContent =
                "Unable to save product.";

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


    if (!product) return;


    document.getElementById(
        "productId"
    ).value = product.id;


    document.getElementById(
        "productName"
    ).value = product.name || "";


    document.getElementById(
        "productSKU"
    ).value = product.sku || "";


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


    productMessage.textContent = "";


    productModal.classList.add(
        "active"
    );

}


// ==========================================
// DELETE PRODUCT
// ==========================================

async function deleteProduct(id) {

    const product =
        products.find(
            (item) =>
                item.id === id
        );


    if (!product) return;


    const confirmed =
        confirm(
            `Delete "${product.name}"?`
        );


    if (!confirmed) return;


    try {

        await deleteDoc(
            doc(
                db,
                "products",
                id
            )
        );


        await loadProducts();


    } catch (error) {

        console.error(
            "Delete error:",
            error
        );


        alert(
            "Unable to delete product."
        );

    }

}


// ==========================================
// SECURITY
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
        async () => {

            try {

                await signOut(auth);

                window.location.href =
                    "login.html";

            } catch (error) {

                console.error(error);

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