import {
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    setDoc
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

const archiveTable =
    document.getElementById("archiveTable");

const archiveCount =
    document.getElementById("archiveCount");

const searchArchive =
    document.getElementById("searchArchive");

const archiveFilter =
    document.getElementById("archiveFilter");

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

const staffNotice =
    document.getElementById("staffNotice");


// ==========================================
// VARIABLES
// ==========================================

let archiveRecords = [];

let currentUserRole = "staff";


// ==========================================
// AUTHENTICATION
// ==========================================

onAuthStateChanged(
    auth,
    async (user) => {

        if (!user) {

            window.location.href =
                "login.html";

            return;
        }


        // ======================================
        // DISPLAY USER
        // ======================================

        userName.textContent =
            user.displayName ||
            user.email;


        // ======================================
        // GET CURRENT USER ROLE
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

                currentUserRole =
                    (
                        userData.role ||
                        "staff"
                    ).toLowerCase();

            } else {

                currentUserRole =
                    "staff";
            }


        } catch (error) {

            console.error(
                "Role error:",
                error
            );

            currentUserRole =
                "staff";
        }


        // ======================================
        // DISPLAY ROLE
        // ======================================

        userRole.textContent =
            currentUserRole
                .charAt(0)
                .toUpperCase()
            +
            currentUserRole.slice(1);


        // ======================================
        // STAFF NOTICE
        // ======================================

        if (
            currentUserRole !== "admin"
        ) {

            staffNotice.style.display =
                "block";
        }


        // ======================================
        // LOAD ARCHIVE
        // ======================================

        await loadArchive();

    }
);


// ==========================================
// LOAD ARCHIVE
// ==========================================

async function loadArchive() {

    try {

        archiveTable.innerHTML = `
            <tr>
                <td
                    colspan="6"
                    class="empty-archive"
                >
                    Loading archive...
                </td>
            </tr>
        `;


        const snapshot =
            await getDocs(
                collection(
                    db,
                    "archive"
                )
            );


        archiveRecords = [];


        snapshot.forEach(
            (archiveDoc) => {

                archiveRecords.push({

                    id:
                        archiveDoc.id,

                    ...archiveDoc.data()

                });

            }
        );


        // ======================================
        // SORT NEWEST FIRST
        // ======================================

        archiveRecords.sort(
            (a, b) => {

                const dateA =
                    getDateValue(
                        a.deletedAt
                    );

                const dateB =
                    getDateValue(
                        b.deletedAt
                    );

                return dateB - dateA;

            }
        );


        displayArchive(
            archiveRecords
        );


    } catch (error) {

        console.error(
            "Archive loading error:",
            error
        );


        archiveTable.innerHTML = `
            <tr>
                <td
                    colspan="6"
                    class="empty-archive"
                >
                    Unable to load archive.
                    <br><br>
                    ${escapeHTML(
                        error.message ||
                        ""
                    )}
                </td>
            </tr>
        `;

    }

}


// ==========================================
// DISPLAY ARCHIVE
// ==========================================

function displayArchive(
    records
) {

    archiveCount.textContent =
        `${records.length} record${
            records.length !== 1
                ? "s"
                : ""
        }`;


    if (
        records.length === 0
    ) {

        archiveTable.innerHTML = `
            <tr>
                <td
                    colspan="6"
                    class="empty-archive"
                >
                    🗄️
                    <br><br>
                    No archived records found.
                </td>
            </tr>
        `;

        return;
    }


    archiveTable.innerHTML = "";


    records.forEach(
        (record) => {

            const originalData =
                record.originalData ||
                {};


            const name =
                originalData.name ||
                originalData.productName ||
                "Unnamed Record";


            const type =
                record.type ||
                "Unknown";


            const deletedBy =
                record.deletedByEmail ||
                record.deletedBy ||
                "Unknown";


            const deletedDate =
                formatDate(
                    record.deletedAt
                );


            const row =
                document.createElement(
                    "tr"
                );


            // ==================================
            // ADMIN ACTIONS
            // ==================================

            let actions = "";


            if (
                currentUserRole === "admin"
            ) {

                actions = `

                    <div class="archive-actions">

                        <button
                            type="button"
                            class="restore-btn"
                            data-id="${record.id}"
                        >
                            ♻️ Restore
                        </button>

                        <button
                            type="button"
                            class="permanent-delete-btn"
                            data-id="${record.id}"
                        >
                            ❌ Delete
                        </button>

                    </div>

                `;

            } else {

                actions = `
                    <span
                        style="
                            color:#aaa;
                            font-size:12px;
                        "
                    >
                        Admin only
                    </span>
                `;
            }


            // ==================================
            // ROW
            // ==================================

            row.innerHTML = `

                <td>

                    <span class="archive-type">

                        ${escapeHTML(type)}

                    </span>

                </td>


                <td>

                    <div class="archive-name">

                        ${escapeHTML(name)}

                    </div>

                    <div class="archive-details">

                        ${escapeHTML(
                            getDetails(
                                record
                            )
                        )}

                    </div>

                </td>


                <td>

                    <span
                        style="
                            font-size:12px;
                            color:#8b817b;
                        "
                    >

                        ${escapeHTML(
                            record.originalId ||
                            "-"
                        )}

                    </span>

                </td>


                <td>

                    ${escapeHTML(deletedBy)}

                </td>


                <td>

                    ${escapeHTML(deletedDate)}

                </td>


                <td>

                    ${actions}

                </td>

            `;


            archiveTable.appendChild(
                row
            );

        }
    );


    // ======================================
    // RESTORE BUTTONS
    // ======================================

    document
        .querySelectorAll(".restore-btn")
        .forEach(
            (button) => {

                button.addEventListener(
                    "click",
                    () => {

                        restoreRecord(
                            button.dataset.id
                        );

                    }
                );

            }
        );


    // ======================================
    // PERMANENT DELETE BUTTONS
    // ======================================

    document
        .querySelectorAll(
            ".permanent-delete-btn"
        )
        .forEach(
            (button) => {

                button.addEventListener(
                    "click",
                    () => {

                        permanentlyDelete(
                            button.dataset.id
                        );

                    }
                );

            }
        );

}


// ==========================================
// GET RECORD DETAILS
// ==========================================

function getDetails(record) {

    const data =
        record.originalData ||
        {};


    if (
        record.type === "Product"
    ) {

        return `SKU: ${
            data.sku || "-"
        } | Stock: ${
            data.stock ?? 0
        }`;

    }


    if (
        record.type === "Category"
    ) {

        return data.description ||
            "No description";

    }


    if (
        record.type === "Supplier"
    ) {

        return `Contact: ${
            data.contactPerson || "-"
        } | Phone: ${
            data.phone || "-"
        }`;

    }


    return "";

}


// ==========================================
// RESTORE RECORD
// ==========================================

async function restoreRecord(
    archiveId
) {

    if (
        currentUserRole !== "admin"
    ) {

        alert(
            "Only Admin can restore records."
        );

        return;
    }


    const record =
        archiveRecords.find(
            (item) =>
                item.id === archiveId
        );


    if (!record) {

        alert(
            "Archive record not found."
        );

        return;
    }


    const originalData =
        record.originalData ||
        {};


    const name =
        originalData.name ||
        originalData.productName ||
        "this record";


    const confirmed =
        confirm(
            `Restore "${name}"?\n\n` +
            `The record will be returned to its original collection.`
        );


    if (!confirmed) {

        return;
    }


    try {

        // ======================================
        // DETERMINE ORIGINAL COLLECTION
        // ======================================

        const collectionName =
            record.originalCollection;


        const originalId =
            record.originalId;


        if (
            !collectionName ||
            !originalId
        ) {

            throw new Error(
                "Archive record is missing original collection or ID."
            );

        }


        // ======================================
        // RESTORE ORIGINAL DOCUMENT
        // ======================================

        await setDoc(

            doc(
                db,
                collectionName,
                originalId
            ),

            originalData

        );


        // ======================================
        // REMOVE FROM ARCHIVE
        // ======================================

        await deleteDoc(

            doc(
                db,
                "archive",
                archiveId
            )

        );


        alert(
            "Record restored successfully!"
        );


        // Reload archive

        await loadArchive();


    } catch (error) {

        console.error(
            "Restore error:",
            error
        );


        alert(
            error.message ||
            "Unable to restore record."
        );

    }

}


// ==========================================
// PERMANENT DELETE
// ==========================================

async function permanentlyDelete(
    archiveId
) {

    if (
        currentUserRole !== "admin"
    ) {

        alert(
            "Only Admin can permanently delete records."
        );

        return;
    }


    const record =
        archiveRecords.find(
            (item) =>
                item.id === archiveId
        );


    if (!record) {

        alert(
            "Archive record not found."
        );

        return;
    }


    const originalData =
        record.originalData ||
        {};


    const name =
        originalData.name ||
        originalData.productName ||
        "this record";


    const confirmed =
        confirm(
            `PERMANENTLY DELETE "${name}"?\n\n` +
            `This action cannot be undone.`
        );


    if (!confirmed) {

        return;
    }


    try {

        await deleteDoc(

            doc(
                db,
                "archive",
                archiveId
            )

        );


        alert(
            "Record permanently deleted."
        );


        await loadArchive();


    } catch (error) {

        console.error(
            "Permanent delete error:",
            error
        );


        alert(
            error.message ||
            "Unable to permanently delete record."
        );

    }

}


// ==========================================
// SEARCH
// ==========================================

searchArchive.addEventListener(
    "input",
    filterArchive
);


// ==========================================
// FILTER
// ==========================================

archiveFilter.addEventListener(
    "change",
    filterArchive
);


// ==========================================
// FILTER ARCHIVE
// ==========================================

function filterArchive() {

    const search =
        searchArchive.value
            .toLowerCase()
            .trim();


    const type =
        archiveFilter.value;


    const filtered =
        archiveRecords.filter(
            (record) => {

                const data =
                    record.originalData ||
                    {};


                const name =
                    String(
                        data.name ||
                        data.productName ||
                        ""
                    )
                        .toLowerCase();


                const sku =
                    String(
                        data.sku ||
                        ""
                    )
                        .toLowerCase();


                const category =
                    String(
                        data.category ||
                        ""
                    )
                        .toLowerCase();


                const recordType =
                    record.type ||
                    "";


                const matchesSearch =
                    !search ||
                    name.includes(search) ||
                    sku.includes(search) ||
                    category.includes(search);


                const matchesType =
                    type === "all" ||
                    recordType === type;


                return (
                    matchesSearch &&
                    matchesType
                );

            }
        );


    displayArchive(
        filtered
    );

}


// ==========================================
// DATE FUNCTIONS
// ==========================================

function getDateValue(
    timestamp
) {

    if (!timestamp) {

        return 0;

    }


    if (
        typeof timestamp.toMillis ===
        "function"
    ) {

        return timestamp.toMillis();

    }


    if (
        timestamp.seconds
    ) {

        return (
            timestamp.seconds * 1000
        );

    }


    return new Date(
        timestamp
    ).getTime() || 0;

}


function formatDate(
    timestamp
) {

    if (!timestamp) {

        return "-";

    }


    let date;


    if (
        typeof timestamp.toDate ===
        "function"
    ) {

        date =
            timestamp.toDate();

    }

    else if (
        timestamp.seconds
    ) {

        date =
            new Date(
                timestamp.seconds * 1000
            );

    }

    else {

        date =
            new Date(timestamp);

    }


    if (
        isNaN(date.getTime())
    ) {

        return "-";

    }


    return date.toLocaleString(
        "en-PH",
        {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit"
        }
    );

}


// ==========================================
// HTML SECURITY
// ==========================================

function escapeHTML(
    value
) {

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