import { auth, db } from "./firebase-config.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";

import {
    collection,
    getDocs,
    getDoc,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";


// ==========================================
// ELEMENTS
// ==========================================

const userName = document.getElementById("userName");
const userRole = document.getElementById("userRole");

const logoutBtn = document.getElementById("logoutBtn");

const menuBtn = document.getElementById("menuBtn");
const sidebar = document.getElementById("sidebar");
const sidebarOverlay = document.getElementById("sidebarOverlay");

const openSupplierBtn =
    document.getElementById("openSupplierBtn");

const supplierModal =
    document.getElementById("supplierModal");

const closeSupplierBtn =
    document.getElementById("closeSupplierBtn");

const cancelSupplierBtn =
    document.getElementById("cancelSupplierBtn");

const supplierForm =
    document.getElementById("supplierForm");

const supplierModalTitle =
    document.getElementById("supplierModalTitle");

const supplierName =
    document.getElementById("supplierName");

const supplierContact =
    document.getElementById("supplierContact");

const supplierPhone =
    document.getElementById("supplierPhone");

const supplierEmail =
    document.getElementById("supplierEmail");

const supplierAddress =
    document.getElementById("supplierAddress");

const supplierMessage =
    document.getElementById("supplierMessage");

const saveSupplierBtn =
    document.getElementById("saveSupplierBtn");

const supplierTable =
    document.getElementById("supplierTable");

const supplierCount =
    document.getElementById("supplierCount");

const searchSupplier =
    document.getElementById("searchSupplier");


// ==========================================
// VARIABLES
// ==========================================

let currentUser = null;

let currentRole = "staff";

let suppliers = [];

let editingSupplierId = null;

let isSavingSupplier = false;


// ==========================================
// AUTHENTICATION
// ==========================================

onAuthStateChanged(auth, async (user) => {

    if (!user) {

        window.location.href = "login.html";

        return;
    }


    currentUser = user;


    // Show logged-in user

    userName.textContent =
        user.displayName || user.email;


    // ======================================
    // GET USER ROLE
    // ======================================

    try {

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
                    userData.role || "staff"
                ).toLowerCase();

        } else {

            currentRole = "staff";

        }


        userRole.textContent =
            capitalize(currentRole);


        console.log(
            "Current role:",
            currentRole
        );


    } catch (error) {

        console.error(
            "Unable to load user role:",
            error
        );


        currentRole = "staff";

        userRole.textContent =
            "Staff";

    }


    // Load suppliers

    await loadSuppliers();

});


// ==========================================
// LOAD SUPPLIERS
// ==========================================

async function loadSuppliers() {

    try {

        supplierTable.innerHTML = `
            <tr>
                <td
                    colspan="6"
                    class="empty-table"
                >
                    Loading suppliers...
                </td>
            </tr>
        `;


        const snapshot =
            await getDocs(
                collection(
                    db,
                    "suppliers"
                )
            );


        suppliers = [];


        snapshot.forEach((supplierDoc) => {

            suppliers.push({

                id:
                    supplierDoc.id,

                ...supplierDoc.data()

            });

        });


        // Sort alphabetically

        suppliers.sort((a, b) => {

            return (
                (a.name || "")
                    .toLowerCase()
                    .localeCompare(
                        (b.name || "")
                            .toLowerCase()
                    )
            );

        });


        displaySuppliers(
            suppliers
        );


    } catch (error) {

        console.error(
            "Unable to load suppliers:",
            error
        );


        supplierTable.innerHTML = `
            <tr>
                <td
                    colspan="6"
                    class="empty-table"
                >
                    Unable to load suppliers.
                </td>
            </tr>
        `;

    }

}


// ==========================================
// DISPLAY SUPPLIERS
// ==========================================

function displaySuppliers(records) {

    supplierTable.innerHTML = "";


    supplierCount.textContent =
        `${records.length} supplier${
            records.length === 1
                ? ""
                : "s"
        }`;


    if (records.length === 0) {

        supplierTable.innerHTML = `
            <tr>
                <td
                    colspan="6"
                    class="empty-table"
                >
                    No suppliers found.
                </td>
            </tr>
        `;

        return;

    }


    records.forEach((supplier) => {

        const row =
            document.createElement("tr");


        // ==================================
        // ACTION BUTTONS
        // ==================================

        let actions = `
            <div class="action-buttons">

                <button
                    type="button"
                    class="edit-btn"
                    data-id="${supplier.id}"
                >
                    Edit
                </button>
        `;


        // Only ADMIN gets Delete

        if (currentRole === "admin") {

            actions += `
                <button
                    type="button"
                    class="delete-btn"
                    data-id="${supplier.id}"
                >
                    Delete
                </button>
            `;

        }


        actions += `
            </div>
        `;


        row.innerHTML = `

            <td>
                <strong>
                    ${escapeHTML(
                        supplier.name || "—"
                    )}
                </strong>
            </td>

            <td>
                ${escapeHTML(
                    supplier.contactPerson || "—"
                )}
            </td>

            <td>
                ${escapeHTML(
                    supplier.phone || "—"
                )}
            </td>

            <td>
                ${escapeHTML(
                    supplier.email || "—"
                )}
            </td>

            <td>
                ${escapeHTML(
                    supplier.address || "—"
                )}
            </td>

            <td>
                ${actions}
            </td>

        `;


        supplierTable.appendChild(row);

    });


    // ==================================
    // EDIT BUTTONS
    // ==================================

    document
        .querySelectorAll(".edit-btn")
        .forEach((button) => {

            button.addEventListener(
                "click",
                () => {

                    const id =
                        button.dataset.id;

                    openEditSupplier(id);

                }
            );

        });


    // ==================================
    // DELETE BUTTONS
    // ==================================

    document
        .querySelectorAll(".delete-btn")
        .forEach((button) => {

            button.addEventListener(
                "click",
                () => {

                    const id =
                        button.dataset.id;

                    deleteSupplier(id);

                }
            );

        });

}


// ==========================================
// OPEN ADD SUPPLIER MODAL
// ==========================================

openSupplierBtn.addEventListener(
    "click",
    () => {

        editingSupplierId = null;

        supplierModalTitle.textContent =
            "Add Supplier";

        saveSupplierBtn.textContent =
            "Save Supplier";

        supplierForm.reset();

        clearMessage();

        supplierModal.classList.add(
            "active"
        );

    }
);


// ==========================================
// OPEN EDIT SUPPLIER
// ==========================================

function openEditSupplier(id) {

    const supplier =
        suppliers.find(
            (item) => item.id === id
        );


    if (!supplier) {

        return;

    }


    editingSupplierId = id;


    supplierModalTitle.textContent =
        "Edit Supplier";


    saveSupplierBtn.textContent =
        "Update Supplier";


    supplierName.value =
        supplier.name || "";


    supplierContact.value =
        supplier.contactPerson || "";


    supplierPhone.value =
        supplier.phone || "";


    supplierEmail.value =
        supplier.email || "";


    supplierAddress.value =
        supplier.address || "";


    clearMessage();


    supplierModal.classList.add(
        "active"
    );

}


// ==========================================
// CLOSE MODAL
// ==========================================

function closeModal() {

    supplierModal.classList.remove(
        "active"
    );


    supplierForm.reset();


    editingSupplierId = null;


    clearMessage();

}


closeSupplierBtn.addEventListener(
    "click",
    closeModal
);


cancelSupplierBtn.addEventListener(
    "click",
    closeModal
);


// Close when clicking outside

supplierModal.addEventListener(
    "click",
    (event) => {

        if (
            event.target ===
            supplierModal
        ) {

            closeModal();

        }

    }
);


// ==========================================
// SAVE / UPDATE SUPPLIER
// ==========================================

supplierForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();


        // Prevent double clicking

        if (isSavingSupplier) {

            return;

        }


        const name =
            supplierName.value.trim();

        const contactPerson =
            supplierContact.value.trim();

        const phone =
            supplierPhone.value.trim();

        const email =
            supplierEmail.value.trim();

        const address =
            supplierAddress.value.trim();


        // ==================================
        // VALIDATION
        // ==================================

        if (!name) {

            showError(
                "Please enter the supplier name."
            );

            return;

        }


        if (!contactPerson) {

            showError(
                "Please enter the contact person."
            );

            return;

        }


        if (!phone) {

            showError(
                "Please enter the phone number."
            );

            return;

        }


        if (!address) {

            showError(
                "Please enter the supplier address."
            );

            return;

        }


        try {

            isSavingSupplier = true;


            saveSupplierBtn.disabled =
                true;


            saveSupplierBtn.textContent =
                editingSupplierId
                    ? "Updating..."
                    : "Saving...";


            // ==================================
            // UPDATE
            // ==================================

            if (editingSupplierId) {

                const supplierRef =
                    doc(
                        db,
                        "suppliers",
                        editingSupplierId
                    );


                await updateDoc(
                    supplierRef,
                    {

                        name:
                            name,

                        contactPerson:
                            contactPerson,

                        phone:
                            phone,

                        email:
                            email,

                        address:
                            address,

                        updatedAt:
                            serverTimestamp(),

                        updatedBy:
                            currentUser.uid

                    }
                );


                showSuccess(
                    "Supplier updated successfully!"
                );


            }

            // ==================================
            // ADD
            // ==================================

            else {

                await addDoc(
                    collection(
                        db,
                        "suppliers"
                    ),
                    {

                        name:
                            name,

                        contactPerson:
                            contactPerson,

                        phone:
                            phone,

                        email:
                            email,

                        address:
                            address,

                        createdAt:
                            serverTimestamp(),

                        createdBy:
                            currentUser.uid

                    }
                );


                showSuccess(
                    "Supplier added successfully!"
                );

            }


            // Reload table

            await loadSuppliers();


            // Close modal

            setTimeout(
                () => {

                    closeModal();

                },
                700
            );


        } catch (error) {

            console.error(
                "SUPPLIER SAVE ERROR:",
                error
            );


            showError(
                error.message ||
                "Unable to save supplier."
            );


        } finally {

            isSavingSupplier = false;


            saveSupplierBtn.disabled =
                false;


            saveSupplierBtn.textContent =
                editingSupplierId
                    ? "Update Supplier"
                    : "Save Supplier";

        }

    }
);


// ==========================================
// DELETE / ARCHIVE SUPPLIER
// ==========================================

async function deleteSupplier(id) {

    // ======================================
    // ADMIN CHECK
    // ======================================

    if (currentRole !== "admin") {

        alert(
            "Only administrators can delete suppliers."
        );

        return;
    }


    // ======================================
    // FIND SUPPLIER
    // ======================================

    const supplier =
        suppliers.find(
            (item) => item.id === id
        );


    if (!supplier) {

        alert("Supplier not found.");

        return;
    }


    // ======================================
    // CONFIRM DELETE
    // ======================================

    const confirmed =
        confirm(
            `Are you sure you want to move "${supplier.name}" to Archive?`
        );


    if (!confirmed) {

        return;
    }


    try {

        // ==================================
        // SUPPLIER REFERENCE
        // ==================================

        const supplierRef =
            doc(
                db,
                "suppliers",
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


        // Remove temporary "id" property
        // before saving the original data
        const {
            id: ignoredId,
            ...originalData
        } = supplier;


        // ==================================
        // SAVE TO ARCHIVE
        // ==================================

        await setDoc(
            archiveRef,
            {

                type:
                    "Supplier",

                originalCollection:
                    "suppliers",

                originalId:
                    id,

                originalData:
                    originalData,

                deletedBy:
                    currentUser?.uid || "",

                deletedByEmail:
                    currentUser?.email || "",

                deletedAt:
                    serverTimestamp()

            }
        );


        // ==================================
        // DELETE ORIGINAL SUPPLIER
        // ==================================

        await deleteDoc(
            supplierRef
        );


        // ==================================
        // RELOAD SUPPLIERS
        // ==================================

        await loadSuppliers();


        alert(
            "Supplier moved to Archive successfully!"
        );


    } catch (error) {

        console.error(
            "ARCHIVE SUPPLIER ERROR:",
            error
        );


        alert(
            "Unable to archive supplier: " +
            error.message
        );

    }

}


// ==========================================
// SEARCH
// ==========================================

searchSupplier.addEventListener(
    "input",
    () => {

        const search =
            searchSupplier.value
                .toLowerCase()
                .trim();


        if (!search) {

            displaySuppliers(
                suppliers
            );

            return;

        }


        const filtered =
            suppliers.filter(
                (supplier) => {

                    return (

                        (
                            supplier.name ||
                            ""
                        )
                            .toLowerCase()
                            .includes(search)

                        ||

                        (
                            supplier.contactPerson ||
                            ""
                        )
                            .toLowerCase()
                            .includes(search)

                        ||

                        (
                            supplier.phone ||
                            ""
                        )
                            .toLowerCase()
                            .includes(search)

                        ||

                        (
                            supplier.email ||
                            ""
                        )
                            .toLowerCase()
                            .includes(search)

                        ||

                        (
                            supplier.address ||
                            ""
                        )
                            .toLowerCase()
                            .includes(search)

                    );

                }
            );


        displaySuppliers(
            filtered
        );

    }
);


// ==========================================
// SUCCESS MESSAGE
// ==========================================

function showSuccess(message) {

    supplierMessage.textContent =
        message;

    supplierMessage.className =
        "form-message success-message";

}


// ==========================================
// ERROR MESSAGE
// ==========================================

function showError(message) {

    supplierMessage.textContent =
        message;

    supplierMessage.className =
        "form-message error-message";

}


// ==========================================
// CLEAR MESSAGE
// ==========================================

function clearMessage() {

    supplierMessage.textContent =
        "";

    supplierMessage.className =
        "form-message";

}


// ==========================================
// CAPITALIZE ROLE
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
