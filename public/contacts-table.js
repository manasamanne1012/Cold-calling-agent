/**
 * Contacts Table Component
 * Fetches contact data from the server and displays it in a styled table
 */

// Initialize when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initContactsTable();
});

// Initialize the contacts table
async function initContactsTable() {
    const contactsContainer = document.getElementById('contacts-container');
    if (!contactsContainer) return;
    
    // Show loading state
    contactsContainer.innerHTML = `
        <div class="flex items-center justify-center py-12">
            <svg class="animate-spin -ml-1 mr-3 h-8 w-8 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span class="text-lg text-slate-500">Loading contacts data...</span>
        </div>
    `;
    
    try {
        // Fetch contact data from the server
        const data = await fetchContactData();
        renderContactsTable(contactsContainer, data);
    } catch (error) {
        console.error('Error loading contacts data:', error);
        contactsContainer.innerHTML = `
            <div class="text-center py-8">
                <svg class="mx-auto h-12 w-12 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
                <p class="mt-4 text-lg font-medium text-slate-800">Failed to load contacts</p>
                <p class="mt-2 text-slate-500">Unable to retrieve contact data. Please try again.</p>
                <button onclick="refreshContacts()" class="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                    Try Again
                </button>
            </div>
        `;
    }
}

// Fetch contact data from the server
async function fetchContactData() {
    const response = await fetch('/api/contacts');
    if (!response.ok) {
        throw new Error('Failed to fetch contacts');
    }
    const responseJson = await response.json();
    
    // Check if the data is properly structured and contains contacts
    if (!responseJson.success || !responseJson.data) {
        console.error('Invalid response format:', responseJson);
        throw new Error('Invalid data format received from server');
    }
    
    return responseJson.data;
}

// Render the contacts table
function renderContactsTable(container, data) {
    // Create table header with sort buttons
    const tableHeader = createTableHeader();
    
    // Create table body with contact data
    const tableRows = data.map(contact => createContactRow(contact)).join('');
    
    // Assemble the complete table with Add New Contact button
    container.innerHTML = `
        <div class="flex justify-between items-center mb-4">
            <h2 class="text-lg font-semibold text-slate-800">Contact List</h2>
            <div class="flex space-x-2">
                <button id="addNewContactBtn" class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                    <svg class="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    Add New Contact
                </button>
                <button id="viewGoogleSheetBtn" class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                    <svg class="-ml-1 mr-2 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    View in Google Sheets
                </button>
                <button id="editGoogleSheetBtn" class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                    <svg class="-ml-1 mr-2 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                    </svg>
                    Edit in Google Sheets
                </button>
            </div>
        </div>
        <div class="bg-white rounded-lg overflow-hidden shadow">
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-slate-200">
                    ${tableHeader}
                    <tbody class="bg-white divide-y divide-slate-200">
                        ${tableRows}
                    </tbody>
                </table>
            </div>
            <div class="bg-slate-50 px-4 py-3 border-t border-slate-200 flex items-center justify-between">
                <div class="flex-1 flex justify-between sm:hidden">
                    <button class="btn-pagination">Previous</button>
                    <button class="btn-pagination">Next</button>
                </div>
                <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                        <p class="text-sm text-slate-700">
                            Showing <span class="font-medium">1</span> to <span class="font-medium">${data.length}</span> of <span class="font-medium">${data.length}</span> contacts
                        </p>
                    </div>
                    <div>
                        <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                            <button class="btn-pagination rounded-l-md">Previous</button>
                            <button class="btn-pagination-active">1</button>
                            <button class="btn-pagination rounded-r-md">Next</button>
                        </nav>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Add New Contact Modal -->
        <div id="addContactModal" class="hidden fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
            <div class="relative bg-white rounded-lg shadow-xl mx-auto p-5 w-full max-w-2xl">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-lg font-medium text-gray-900">Add New Contact</h3>
                    <button id="closeModalBtn" class="text-gray-400 hover:text-gray-500">
                        <svg class="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <form id="newContactForm" class="space-y-4">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label for="name" class="block text-sm font-medium text-gray-700">Name</label>
                            <input type="text" id="name" name="name" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" required>
                        </div>
                        <div>
                            <label for="industry" class="block text-sm font-medium text-gray-700">Industry</label>
                            <input type="text" id="industry" name="industry" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" required>
                        </div>
                        <div>
                            <label for="location" class="block text-sm font-medium text-gray-700">Location</label>
                            <input type="text" id="location" name="location" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" required>
                        </div>
                        <div>
                            <label for="status" class="block text-sm font-medium text-gray-700">Call Status</label>
                            <select id="status" name="status" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" required>
                                <option value="">Select Status</option>
                                <option value="Meeting Booked">Meeting Booked</option>
                                <option value="Pending">Pending</option>
                                <option value="Scheduled">Scheduled</option>
                                <option value="Pending Recall">Pending Recall</option>
                                <option value="In Progress">In Progress</option>
                            </select>
                        </div>
                        <div>
                            <label for="phone" class="block text-sm font-medium text-gray-700">Phone</label>
                            <input type="tel" id="phone" name="phone" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                        </div>
                        <div>
                            <label for="email" class="block text-sm font-medium text-gray-700">Email</label>
                            <input type="email" id="email" name="email" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                        </div>
                    </div>
                    <div>
                        <label for="companyInfo" class="block text-sm font-medium text-gray-700">Company Info</label>
                        <textarea id="companyInfo" name="companyInfo" rows="3" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"></textarea>
                    </div>
                    <div class="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                        <button type="button" id="cancelAddContact" class="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                            Cancel
                        </button>
                        <button type="submit" class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                            Save Contact
                        </button>
                    </div>
                </form>
            </div>
        </div>
        
        <!-- Edit Contact Modal -->
        <div id="editContactModal" class="hidden fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
            <div class="relative bg-white rounded-lg shadow-xl mx-auto p-5 w-full max-w-2xl">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-lg font-medium text-gray-900">Edit Contact</h3>
                    <button id="closeEditModalBtn" class="text-gray-400 hover:text-gray-500">
                        <svg class="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <form id="editContactForm" class="space-y-4">
                    <input type="hidden" id="editContactId" name="id">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label for="editName" class="block text-sm font-medium text-gray-700">Name</label>
                            <input type="text" id="editName" name="name" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" required>
                        </div>
                        <div>
                            <label for="editIndustry" class="block text-sm font-medium text-gray-700">Industry</label>
                            <input type="text" id="editIndustry" name="industry" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" required>
                        </div>
                        <div>
                            <label for="editLocation" class="block text-sm font-medium text-gray-700">Location</label>
                            <input type="text" id="editLocation" name="location" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" required>
                        </div>
                        <div>
                            <label for="editStatus" class="block text-sm font-medium text-gray-700">Call Status</label>
                            <select id="editStatus" name="status" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" required>
                                <option value="">Select Status</option>
                                <option value="Meeting Booked">Meeting Booked</option>
                                <option value="Pending">Pending</option>
                                <option value="Scheduled">Scheduled</option>
                                <option value="Pending Recall">Pending Recall</option>
                                <option value="In Progress">In Progress</option>
                            </select>
                        </div>
                        <div>
                            <label for="editPhone" class="block text-sm font-medium text-gray-700">Phone</label>
                            <input type="tel" id="editPhone" name="phone" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                        </div>
                        <div>
                            <label for="editEmail" class="block text-sm font-medium text-gray-700">Email</label>
                            <input type="email" id="editEmail" name="email" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                        </div>
                    </div>
                    <div>
                        <label for="editCompanyInfo" class="block text-sm font-medium text-gray-700">Company Info</label>
                        <textarea id="editCompanyInfo" name="companyInfo" rows="3" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"></textarea>
                    </div>
                    <div class="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                        <button type="button" id="cancelEditContact" class="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                            Cancel
                        </button>
                        <button type="submit" class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                            Update Contact
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    // Add event listeners for sorting, filtering, and the new add contact functionality
    attachTableEventListeners();
}

// Create the table header with sort buttons
function createTableHeader() {
    return `
        <thead class="bg-slate-50">
            <tr>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    <button class="flex items-center space-x-1 group" data-sort="name">
                        <span>Name</span>
                        <svg class="h-4 w-4 text-slate-400 group-hover:text-slate-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9" />
                        </svg>
                    </button>
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    <button class="flex items-center space-x-1 group" data-sort="industry">
                        <span>Industry</span>
                        <svg class="h-4 w-4 text-slate-400 group-hover:text-slate-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9" />
                        </svg>
                    </button>
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    <button class="flex items-center space-x-1 group" data-sort="location">
                        <span>Location</span>
                        <svg class="h-4 w-4 text-slate-400 group-hover:text-slate-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9" />
                        </svg>
                    </button>
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    <button class="flex items-center space-x-1 group" data-sort="status">
                        <span>Status</span>
                        <svg class="h-4 w-4 text-slate-400 group-hover:text-slate-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9" />
                        </svg>
                    </button>
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    <span>Company Info</span>
                </th>
                <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                    <span>Actions</span>
                </th>
            </tr>
        </thead>
    `;
}

// Create a table row for a contact
function createContactRow(contact) {
    // Define status colors based on call status
    const statusColors = {
        'Meeting Booked': 'bg-green-100 text-green-800',
        'Pending': 'bg-amber-100 text-amber-800',
        'Scheduled': 'bg-blue-100 text-blue-800',
        'Pending Recall': 'bg-red-100 text-red-800',
        'In Progress': 'bg-purple-100 text-purple-800'
    };
    
    // Get the status value checking both status and callstatus fields
    const contactStatus = contact.status || contact.callstatus || 'Unknown';
    const statusColor = statusColors[contactStatus] || 'bg-slate-100 text-slate-800';
    
    // Store contact data as JSON string for easier access
    const contactDataStr = encodeURIComponent(JSON.stringify(contact));
    
    return `
        <tr class="hover:bg-slate-50 transition-colors" data-id="${contact.id || ''}">
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                    <div class="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-full bg-slate-100 text-slate-700 uppercase font-medium">
                        ${contact.name ? contact.name.charAt(0) : 'U'}
                    </div>
                    <div class="ml-4">
                        <div class="text-sm font-medium text-slate-900">${contact.name || 'Unknown'}</div>
                    </div>
                </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-slate-900">${contact.industry || 'N/A'}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-slate-900">${contact.location || 'N/A'}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColor}">
                    ${contactStatus}
                </span>
            </td>
            <td class="px-6 py-4">
                <div class="text-sm text-slate-500 max-w-xs truncate">${contact.companyInfo || 'No company information available'}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button class="text-indigo-600 hover:text-indigo-900 mr-3" data-action="view" data-id="${contact.id}">View</button>
                <button class="text-indigo-600 hover:text-indigo-900" data-action="edit" data-id="${contact.id}" 
                    data-contact="${contactDataStr}">Edit</button>
            </td>
        </tr>
    `;
}

// Attach event listeners to the table
function attachTableEventListeners() {
    // Sort buttons
    document.querySelectorAll('button[data-sort]').forEach(button => {
        button.addEventListener('click', () => {
            const sortBy = button.getAttribute('data-sort');
            console.log(`Sorting by ${sortBy}`);
            // Implement sorting logic here
        });
    });
    
    // View/Edit buttons
    document.querySelectorAll('button[data-action]').forEach(button => {
        button.addEventListener('click', () => {
            const action = button.getAttribute('data-action');
            const id = button.getAttribute('data-id');
            
            if (action === 'edit') {
                // Populate and show edit modal
                openEditModal(button);
            } else if (action === 'view') {
                console.log(`View contact ${id}`);
                // Implement view logic here or direct to Google Sheets
                const sheetId = '1vOfTLk14C0G9Dz1rTTJIpEe1XB9eDRRv65fnYVQrLWw';
                const sheetUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/view`;
                window.open(sheetUrl, '_blank');
            }
        });
    });
    
    // Add new contact button
    const addNewContactBtn = document.getElementById('addNewContactBtn');
    if (addNewContactBtn) {
        addNewContactBtn.addEventListener('click', () => {
            const modal = document.getElementById('addContactModal');
            modal.classList.remove('hidden');
        });
    }
    
    // Close modal button
    const closeModalBtn = document.getElementById('closeModalBtn');
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            const modal = document.getElementById('addContactModal');
            modal.classList.add('hidden');
        });
    }
    
    // Cancel button in modal
    const cancelAddContact = document.getElementById('cancelAddContact');
    if (cancelAddContact) {
        cancelAddContact.addEventListener('click', () => {
            const modal = document.getElementById('addContactModal');
            modal.classList.add('hidden');
        });
    }
    
    // Contact form submission
    const newContactForm = document.getElementById('newContactForm');
    if (newContactForm) {
        newContactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Get form data
            const formData = new FormData(newContactForm);
            const contactData = {
                name: formData.get('name'),
                industry: formData.get('industry'),
                location: formData.get('location'),
                status: formData.get('status'),
                phone: formData.get('phone'),
                email: formData.get('email'),
                companyInfo: formData.get('companyInfo')
            };
            
            try {
                // Call API to save the new contact
                const result = await saveNewContact(contactData);
                
                // Close the modal
                const modal = document.getElementById('addContactModal');
                modal.classList.add('hidden');
                
                // Reset the form
                newContactForm.reset();
                
                // Show success message based on where it was saved
                if (result.storage && !result.storage.googleSheets && result.storage.local) {
                    showNotification('Contact added to local storage (Google Sheets write access requires OAuth credentials)', 'success');
                } else {
                    showNotification('Contact added successfully!', 'success');
                }
                
                // Force a small delay to ensure server has time to process
                setTimeout(() => {
                    // Refresh the contacts list
                    refreshContacts();
                }, 500);
                
            } catch (error) {
                console.error('Error adding new contact:', error);
                showNotification('Failed to add contact. Please try again.', 'error');
            }
        });
    }
    
    // Edit form handlers
    const closeEditModalBtn = document.getElementById('closeEditModalBtn');
    if (closeEditModalBtn) {
        closeEditModalBtn.addEventListener('click', () => {
            const modal = document.getElementById('editContactModal');
            modal.classList.add('hidden');
        });
    }
    
    const cancelEditContact = document.getElementById('cancelEditContact');
    if (cancelEditContact) {
        cancelEditContact.addEventListener('click', () => {
            const modal = document.getElementById('editContactModal');
            modal.classList.add('hidden');
        });
    }
    
    const editContactForm = document.getElementById('editContactForm');
    if (editContactForm) {
        editContactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Get form data
            const formData = new FormData(editContactForm);
            const contactId = formData.get('id');
            const contactData = {
                id: contactId,
                name: formData.get('name'),
                industry: formData.get('industry'),
                location: formData.get('location'),
                status: formData.get('status'),
                phone: formData.get('phone'),
                email: formData.get('email'),
                companyInfo: formData.get('companyInfo')
            };
            
            try {
                // Call API to update the contact
                await updateContact(contactId, contactData);
                
                // Close the modal
                const modal = document.getElementById('editContactModal');
                modal.classList.add('hidden');
                
                // Refresh the contacts list
                refreshContacts();
                
                // Show success message
                showNotification('Contact updated successfully!', 'success');
            } catch (error) {
                console.error('Error updating contact:', error);
                showNotification('Failed to update contact. Please try again.', 'error');
            }
        });
    }
    
    // Google Sheets view/edit buttons
    const viewGoogleSheetBtn = document.getElementById('viewGoogleSheetBtn');
    if (viewGoogleSheetBtn) {
        viewGoogleSheetBtn.addEventListener('click', () => {
            const sheetId = '1vOfTLk14C0G9Dz1rTTJIpEe1XB9eDRRv65fnYVQrLWw'; // This should be dynamically retrieved from environment
            const sheetUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/view`;
            window.open(sheetUrl, '_blank');
        });
    }
    
    const editGoogleSheetBtn = document.getElementById('editGoogleSheetBtn');
    if (editGoogleSheetBtn) {
        editGoogleSheetBtn.addEventListener('click', () => {
            const sheetId = '1vOfTLk14C0G9Dz1rTTJIpEe1XB9eDRRv65fnYVQrLWw'; // This should be dynamically retrieved from environment
            const sheetUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/edit`;
            window.open(sheetUrl, '_blank');
        });
    }
}

// Open edit modal and populate with contact data
function openEditModal(button) {
    try {
        // Get contact data from button attributes
        const contactId = button.getAttribute('data-id');
        const contactDataStr = button.getAttribute('data-contact');
        
        let contactData;
        
        if (contactDataStr) {
            // Parse the contact data from the JSON string
            contactData = JSON.parse(decodeURIComponent(contactDataStr));
        } else {
            // Fallback to the old way for backwards compatibility
            contactData = {
                id: contactId,
                name: button.getAttribute('data-name') || '',
                industry: button.getAttribute('data-industry') || '',
                location: button.getAttribute('data-location') || '',
                status: button.getAttribute('data-status') || '',
                companyInfo: button.getAttribute('data-company') || '',
                phone: button.getAttribute('data-phone') || '',
                email: button.getAttribute('data-email') || ''
            };
        }
        
        // Populate the edit form
        document.getElementById('editContactId').value = contactData.id || contactId;
        document.getElementById('editName').value = contactData.name || '';
        document.getElementById('editIndustry').value = contactData.industry || '';
        document.getElementById('editLocation').value = contactData.location || '';
        document.getElementById('editStatus').value = contactData.status || contactData.callstatus || '';
        document.getElementById('editCompanyInfo').value = contactData.companyInfo || '';
        document.getElementById('editPhone').value = contactData.phone || '';
        document.getElementById('editEmail').value = contactData.email || '';
        
        // Show the modal
        const modal = document.getElementById('editContactModal');
        modal.classList.remove('hidden');
    } catch (error) {
        console.error('Error opening edit modal:', error);
        showNotification('Failed to open edit modal. Please try again.', 'error');
    }
}

// Update contact
async function updateContact(id, contactData) {
    const response = await fetch(`/api/contacts/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(contactData)
    });
    
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update contact');
    }
    
    return await response.json();
}

// Refresh contacts data
function refreshContacts() {
    const contactsContainer = document.getElementById('contacts-container');
    if (contactsContainer) {
        initContactsTable();
    }
}

// Show notification
function showNotification(message, type = 'info') {
    // Create notification element if it doesn't exist
    let notification = document.getElementById('notification');
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'notification';
        notification.classList.add('fixed', 'top-4', 'right-4', 'z-50', 'p-4', 'rounded-md', 'shadow-lg', 'transition-opacity', 'duration-500');
        document.body.appendChild(notification);
    }
    
    // Set notification style based on type
    notification.className = 'fixed top-4 right-4 z-50 p-4 rounded-md shadow-lg transition-opacity duration-500';
    if (type === 'success') {
        notification.classList.add('bg-green-50', 'text-green-800', 'border', 'border-green-200');
    } else if (type === 'error') {
        notification.classList.add('bg-red-50', 'text-red-800', 'border', 'border-red-200');
    } else {
        notification.classList.add('bg-blue-50', 'text-blue-800', 'border', 'border-blue-200');
    }
    
    // Set message and show notification
    notification.textContent = message;
    notification.style.opacity = '1';
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            notification.remove();
        }, 500);
    }, 3000);
}

// Save new contact to the server
async function saveNewContact(contactData) {
    const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(contactData)
    });
    
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add contact');
    }
    
    const result = await response.json();
    
    // Check if it was saved to Google Sheets or local storage
    if (result.storage && !result.storage.googleSheets && result.storage.local) {
        // Show a special notification for local storage
        showNotification('Contact saved to local storage (Google Sheets write access requires OAuth credentials)', 'info');
    }
    
    return result;
}

// Add search functionality
function searchContacts(query) {
    // Implement search logic here
    console.log(`Searching for ${query}`);
}

// Style definitions for pagination buttons (can be moved to CSS file)
document.addEventListener('DOMContentLoaded', () => {
    const style = document.createElement('style');
    style.textContent = `
        .btn-pagination {
            position: relative;
            display: inline-flex;
            items-center: center;
            padding-left: 1rem;
            padding-right: 1rem;
            padding-top: 0.5rem;
            padding-bottom: 0.5rem;
            font-size: 0.875rem;
            line-height: 1.25rem;
            font-medium: true;
            border-width: 1px;
            border-color: #e2e8f0;
            background-color: white;
            color: #4b5563;
            cursor: pointer;
        }
        .btn-pagination:hover {
            background-color: #f8fafc;
        }
        .btn-pagination-active {
            position: relative;
            display: inline-flex;
            items-center: center;
            padding-left: 1rem;
            padding-right: 1rem;
            padding-top: 0.5rem;
            padding-bottom: 0.5rem;
            font-size: 0.875rem;
            line-height: 1.25rem;
            font-weight: 500;
            border-width: 1px;
            border-color: #4f46e5;
            background-color: #4f46e5;
            color: white;
            cursor: default;
        }
    `;
    document.head.appendChild(style);
});
