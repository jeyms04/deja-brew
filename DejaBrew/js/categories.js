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
import { auth, db } from "./firebase-config.js";
import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";

// ==========================================
// ELEMENTS
// ==========================================

const categoriesTable =
    document.getElementById("categoriesTable");

const categoryCount =
    document.getElementById("categoryCount");

const searchCategory =
    document.getElementById("searchCategory");

const categoryModal =
    document.getElementById("categoryModal");

const addCategoryBtn =
    document.getElementById("addCategoryBtn");

const closeCategoryModal =
    document.getElementById("closeCategoryModal");

const cancelCategory =
    document.getElementById("cancelCategory");

const categoryForm =
    document.getElementById("categoryForm");

const categoryModalTitle =
    document.getElementById("categoryModalTitle");

const categoryMessage =
    document.getElementById("categoryMessage");


// ==========================================
// DATA
// ==========================================

let categories = [];
let products = [];

let currentUserRole = "staff";

// Prevent double-clicking Save
let isSavingCategory = false;


// ==========================================
// AUTHENTICATION
// ==========================================

onAuthStateChanged(auth, async (user) => {

    if (!user) {

        window.location.href =
            "login.html";

        return;
    }


    // ======================================
    // DISPLAY USER NAME
    // ======================================

    document.getElementById("userName").textContent =
        user.displayName || user.email;


    // ======================================
    // GET CURRENT USER ROLE
    // ======================================

    try {

        // Get ONLY the currently logged-in
        // user's document.

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


            currentUserRole =
                (
                    userData.role ||
                    "staff"
                ).toLowerCase();

        } else {

            currentUserRole =
                "staff";

        }


        // ==================================
        // DISPLAY ROLE
        // ==================================

        document.getElementById("userRole")
            .textContent =
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


        document.getElementById("userRole")
            .textContent =
            "Staff";

    }


    // ======================================
    // LOAD DATA
    // ======================================

    await loadProducts();

    await loadCategories();

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

    } catch (error) {

        console.error(
            "Error loading products:",
            error
        );

    }

}


// ==========================================
// LOAD CATEGORIES
// ==========================================

async function loadCategories() {

    try {

        const snapshot =
            await getDocs(
                collection(db, "categories")
            );


        categories = [];


        snapshot.forEach((categoryDoc) => {

            categories.push({

                id: categoryDoc.id,

                ...categoryDoc.data()

            });

        });


        displayCategories(categories);

    } catch (error) {

        console.error(
            "Error loading categories:",
            error
        );


        categoriesTable.innerHTML = `

            <tr>

                <td
                    colspan="4"
                    class="empty-table"
                >
                    Unable to load categories.
                </td>

            </tr>

        `;

    }

}


// ==========================================
// DISPLAY CATEGORIES
// ==========================================

function displayCategories(categoryList) {

    const count =
        categoryList.length;


    if (count === 1) {

        categoryCount.textContent =
            "1 category";

    } else {

        categoryCount.textContent =
            `${count} categories`;

    }


    // No categories
    if (categoryList.length === 0) {

        categoriesTable.innerHTML = `

            <tr>

                <td
                    colspan="4"
                    class="empty-table"
                >
                    No categories found.
                </td>

            </tr>

        `;

        return;

    }


    categoriesTable.innerHTML = "";


    categoryList.forEach((category) => {


        // Count products using this category
        const productTotal =
            products.filter(
                (product) =>

                    String(
                        product.category || ""
                    )
                    .toLowerCase()

                    ===

                    String(
                        category.name || ""
                    )
                    .toLowerCase()

            ).length;


        const row =
            document.createElement("tr");


        row.innerHTML = `

            <td>

                <div class="product-name-cell">

                    <div class="product-icon">
                        🗂️
                    </div>

                    <strong>
                        ${escapeHTML(
                            category.name ||
                            "Unnamed"
                        )}
                    </strong>

                </div>

            </td>


            <td>
                ${escapeHTML(
                    category.description ||
                    "No description"
                )}
            </td>


            <td>

                <span
                    class="status-badge status-good"
                >
                    ${productTotal}
                </span>

            </td>


            <td>

                <div class="action-buttons">

                    <button
                        type="button"
                        class="edit-btn"
                        data-id="${category.id}"
                    >
                        ✏️
                    </button>

                    ${
                        currentUserRole === "admin"
                            ? `
                                <button
                                    type="button"
                                    class="delete-btn"
                                    data-id="${category.id}"
                                >
                                    🗑️
                                </button>
                            `
                            : ""
                    }

                </div>

            </td>

        `;


        categoriesTable.appendChild(row);

    });


    // ======================================
    // EDIT BUTTONS
    // ======================================

    document
        .querySelectorAll(".edit-btn")
        .forEach((button) => {

            button.addEventListener(
                "click",
                (event) => {

                    event.preventDefault();

                    editCategory(
                        button.dataset.id
                    );

                }
            );

        });


    // ======================================
    // DELETE BUTTONS
    // ======================================

    document
        .querySelectorAll(".delete-btn")
        .forEach((button) => {

            button.addEventListener(
                "click",
                (event) => {

                    event.preventDefault();

                    deleteCategory(
                        button.dataset.id
                    );

                }
            );

        });

}


// ==========================================
// SEARCH
// ==========================================

searchCategory.addEventListener(
    "input",
    () => {

        const search =
            searchCategory.value
                .toLowerCase()
                .trim();


        const filtered =
            categories.filter((category) => {

                return (

                    String(
                        category.name || ""
                    )
                    .toLowerCase()
                    .includes(search)

                    ||

                    String(
                        category.description || ""
                    )
                    .toLowerCase()
                    .includes(search)

                );

            });


        displayCategories(filtered);

    }
);


// ==========================================
// OPEN ADD CATEGORY MODAL
// ==========================================

addCategoryBtn.addEventListener(
    "click",
    (event) => {

        event.preventDefault();


        categoryForm.reset();


        document.getElementById(
            "categoryId"
        ).value = "";


        categoryModalTitle.textContent =
            "Add Category";


        categoryMessage.textContent = "";

        categoryMessage.className =
            "form-message";


        categoryModal.classList.add(
            "active"
        );

    }
);


// ==========================================
// CLOSE MODAL FUNCTION
// ==========================================

function closeModal() {

    categoryModal.classList.remove(
        "active"
    );


    categoryForm.reset();


    document.getElementById(
        "categoryId"
    ).value = "";


    categoryModalTitle.textContent =
        "Add Category";


    categoryMessage.textContent = "";

    categoryMessage.className =
        "form-message";


    // Restore Save button
    const saveButton =
        categoryForm.querySelector(
            'button[type="submit"]'
        );


    if (saveButton) {

        saveButton.disabled = false;

        saveButton.textContent =
            "Save Category";

    }


    isSavingCategory = false;

}


// ==========================================
// CLOSE USING X
// ==========================================

closeCategoryModal.addEventListener(
    "click",
    (event) => {

        event.preventDefault();

        event.stopPropagation();

        closeModal();

    }
);


// ==========================================
// CLOSE USING CANCEL
// ==========================================

cancelCategory.addEventListener(
    "click",
    (event) => {

        event.preventDefault();

        event.stopPropagation();

        closeModal();

    }
);


// ==========================================
// CLOSE WHEN CLICKING OUTSIDE
// ==========================================

categoryModal.addEventListener(
    "click",
    (event) => {

        if (
            event.target === categoryModal
        ) {

            closeModal();

        }

    }
);


// ==========================================
// CLOSE USING ESCAPE
// ==========================================

document.addEventListener(
    "keydown",
    (event) => {

        if (
            event.key === "Escape"
            &&
            categoryModal.classList.contains(
                "active"
            )
        ) {

            closeModal();

        }

    }
);


// ==========================================
// SAVE CATEGORY
// ==========================================

categoryForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();


        // ======================================
        // PREVENT DOUBLE CLICK
        // ======================================

        if (isSavingCategory) {

            return;

        }


        isSavingCategory = true;


        const saveButton =
            categoryForm.querySelector(
                'button[type="submit"]'
            );


        // Disable immediately
        saveButton.disabled = true;

        saveButton.textContent =
            "Saving...";


        // ======================================
        // GET FORM DATA
        // ======================================

        const id =
            document.getElementById(
                "categoryId"
            ).value;


        const name =
            document.getElementById(
                "categoryName"
            ).value
            .trim();


        const description =
            document.getElementById(
                "categoryDescription"
            ).value
            .trim();


        // ======================================
        // VALIDATE NAME
        // ======================================

        if (!name) {

            categoryMessage.textContent =
                "Please enter a category name.";

            categoryMessage.className =
                "form-message error-message";


            saveButton.disabled = false;

            saveButton.textContent =
                "Save Category";

            isSavingCategory = false;


            return;

        }


        // ======================================
        // CHECK DUPLICATE
        // ======================================

        const duplicate =
            categories.some((category) => {

                return (

                    String(
                        category.name || ""
                    )
                    .toLowerCase()
                    .trim()

                    ===

                    name
                        .toLowerCase()
                        .trim()

                    &&

                    category.id !== id

                );

            });


        if (duplicate) {

            categoryMessage.textContent =
                "This category already exists.";

            categoryMessage.className =
                "form-message error-message";


            saveButton.disabled = false;

            saveButton.textContent =
                "Save Category";

            isSavingCategory = false;


            return;

        }


        // ======================================
        // SAVE TO FIREBASE
        // ======================================

        try {


            // ==================================
            // EDIT CATEGORY
            // ==================================

            if (id) {

                await updateDoc(

                    doc(
                        db,
                        "categories",
                        id
                    ),

                    {

                        name: name,

                        description:
                            description,

                        updatedAt:
                            serverTimestamp()

                    }

                );


                categoryMessage.textContent =
                    "Category updated successfully!";

            }


            // ==================================
            // ADD CATEGORY
            // ==================================

            else {

                await addDoc(

                    collection(
                        db,
                        "categories"
                    ),

                    {

                        name: name,

                        description:
                            description,

                        createdAt:
                            serverTimestamp()

                    }

                );


                categoryMessage.textContent =
                    "Category added successfully!";

            }


            categoryMessage.className =
                "form-message success-message";


            // Reload categories
            await loadCategories();


            // Close modal
            closeModal();


        } catch (error) {

            console.error(
                "Category save error:",
                error
            );


            categoryMessage.textContent =
                "Unable to save category.";

            categoryMessage.className =
                "form-message error-message";


            // Allow another attempt
            saveButton.disabled = false;

            saveButton.textContent =
                "Save Category";

            isSavingCategory = false;

        }

    }
);


// ==========================================
// EDIT CATEGORY
// ==========================================

function editCategory(id) {

    const category =
        categories.find(
            (item) =>
                item.id === id
        );


    if (!category) {

        return;

    }


    document.getElementById(
        "categoryId"
    ).value =
        category.id;


    document.getElementById(
        "categoryName"
    ).value =
        category.name || "";


    document.getElementById(
        "categoryDescription"
    ).value =
        category.description || "";


    categoryModalTitle.textContent =
        "Edit Category";


    categoryMessage.textContent = "";

    categoryMessage.className =
        "form-message";


    categoryModal.classList.add(
        "active"
    );

}


// ==========================================
// ARCHIVE CATEGORY
// ==========================================

async function deleteCategory(id) {

    // Only Admin can archive categories
    if (currentUserRole !== "admin") {

        alert(
            "Only administrators can archive categories."
        );

        return;
    }


    // ======================================
    // FIND CATEGORY
    // ======================================

    const category =
        categories.find(
            (item) =>
                item.id === id
        );


    if (!category) {

        alert("Category not found.");

        return;
    }


    // ======================================
    // CHECK IF CATEGORY IS BEING USED
    // ======================================

    try {

        const productsSnapshot =
            await getDocs(
                collection(
                    db,
                    "products"
                )
            );


        const usedByProducts =
            productsSnapshot.docs.some(
                (productDoc) => {

                    const product =
                        productDoc.data();

                    return (
                        String(
                            product.category || ""
                        )
                            .toLowerCase()
                        ===
                        String(
                            category.name || ""
                        )
                            .toLowerCase()
                    );

                }
            );


        if (usedByProducts) {

            alert(
                `Cannot archive "${category.name}".\n\n` +
                `This category is currently being used by one or more products.\n\n` +
                `Please change the products to another category first.`
            );

            return;
        }



        // ==================================
        // CATEGORY REFERENCE
        // ==================================

        const categoryRef =
            doc(
                db,
                "categories",
                id
            );


        // ==================================
        // CREATE ARCHIVE DOCUMENT
        // ==================================

        const archiveRef =
            doc(
                collection(
                    db,
                    "archive"
                )
            );


        // Remove temporary ID before storing
        const {
            id: ignoredId,
            ...originalData
        } = category;


        // ==================================
        // SAVE CATEGORY TO ARCHIVE
        // ==================================

        await setDoc(
            archiveRef,
            {

                type:
                    "Category",

                originalCollection:
                    "categories",

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


        // ==================================
        // DELETE ORIGINAL CATEGORY
        // ==================================

        await deleteDoc(
            categoryRef
        );


        // ==================================
        // RELOAD CATEGORIES
        // ==================================

        await loadCategories();


        showAlert(
            "Category Archived",
            `${category.name} has been moved to Archive successfully.`
        );


    } catch (error) {

        console.error(
            "Archive category error:",
            error
        );


        alert(
            error.message ||
            "Unable to archive category."
        );

    }

}


// ==========================================
// SECURITY - ESCAPE HTML
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


if (menuBtn && sidebar && sidebarOverlay) {

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
