// ==================== STATE MANAGEMENT ====================
let allProducts = [];
let filteredProducts = [];
let categories = [];
let currentPage = 1;
let itemsPerPage = 10;
let sortOrder = {
    field: null,
    direction: null
};
let currentProductId = null;
let isEditMode = false;

// ==================== API CONFIGURATION ====================
const API_BASE_URL = 'https://api.escuelajs.co/api/v1';

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', async () => {
    await initializeApp();
    setupEventListeners();
});

async function initializeApp() {
    showLoading(true);
    try {
        await Promise.all([
            fetchProducts(),
            fetchCategories()
        ]);
        filteredProducts = [...allProducts];
        renderTable();
        renderPagination();
        updatePaginationInfo();
    } catch (error) {
        console.error('Error initializing app:', error);
        showNotification('Failed to load data. Please refresh the page.', 'error');
    } finally {
        showLoading(false);
    }
}

function setupEventListeners() {
    // Search input with debounce
    let searchTimeout;
    document.getElementById('searchInput').addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            handleSearch(e.target.value);
        }, 300);
    });

    // Items per page selector
    document.getElementById('itemsPerPage').addEventListener('change', (e) => {
        handleItemsPerPageChange(parseInt(e.target.value));
    });

    // Tooltip functionality
    document.addEventListener('mousemove', (e) => {
        const tooltip = document.getElementById('descriptionTooltip');
        tooltip.style.left = (e.pageX + 15) + 'px';
        tooltip.style.top = (e.pageY + 15) + 'px';
    });
}

// ==================== API FUNCTIONS ====================
async function fetchProducts() {
    try {
        const response = await fetch(`${API_BASE_URL}/products`);
        if (!response.ok) throw new Error('Failed to fetch products');
        allProducts = await response.json();
        return allProducts;
    } catch (error) {
        console.error('Error fetching products:', error);
        throw error;
    }
}

async function fetchCategories() {
    try {
        const response = await fetch(`${API_BASE_URL}/categories`);
        if (!response.ok) throw new Error('Failed to fetch categories');
        categories = await response.json();
        populateCategorySelect();
        return categories;
    } catch (error) {
        console.error('Error fetching categories:', error);
        throw error;
    }
}

async function getProductById(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/products/${id}`);
        if (!response.ok) throw new Error('Failed to fetch product details');
        return await response.json();
    } catch (error) {
        console.error('Error fetching product:', error);
        throw error;
    }
}

async function updateProduct(id, data) {
    try {
        const response = await fetch(`${API_BASE_URL}/products/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error('Failed to update product');
        return await response.json();
    } catch (error) {
        console.error('Error updating product:', error);
        throw error;
    }
}

async function createNewProduct(data) {
    try {
        const response = await fetch(`${API_BASE_URL}/products`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error('Failed to create product');
        return await response.json();
    } catch (error) {
        console.error('Error creating product:', error);
        throw error;
    }
}

// ==================== UI RENDERING ====================
function renderTable() {
    const tbody = document.getElementById('tableBody');
    const currentData = getCurrentPageData();

    if (currentData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="empty-state">
                    <i class="bi bi-inbox"></i>
                    <h4>No Products Found</h4>
                    <p>Try adjusting your search criteria</p>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = currentData.map(product => `
        <tr onclick="showDetailModal(${product.id})" 
            onmouseenter="showDescription(event, ${product.id})"
            onmouseleave="hideDescription()">
            <td><strong>#${product.id}</strong></td>
            <td>
                <img src="${getProductImage(product)}" 
                     alt="${product.title}" 
                     class="product-img"
                     onerror="this.src='https://via.placeholder.com/60?text=No+Image'">
            </td>
            <td>${escapeHtml(product.title)}</td>
            <td><span class="badge badge-price">$${product.price.toFixed(2)}</span></td>
            <td><span class="badge badge-category">${escapeHtml(product.category?.name || 'N/A')}</span></td>
            <td>
                <button class="btn btn-sm btn-gradient-primary" onclick="event.stopPropagation(); showDetailModal(${product.id})">
                    <i class="bi bi-eye"></i> View
                </button>
            </td>
        </tr>
    `).join('');
}

function renderPagination() {
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    const paginationControls = document.getElementById('paginationControls');

    if (totalPages <= 1) {
        paginationControls.innerHTML = '';
        return;
    }

    let pages = [];

    // Previous button
    pages.push(`
        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="handlePageChange(${currentPage - 1}); return false;">
                <i class="bi bi-chevron-left"></i>
            </a>
        </li>
    `);

    // Page numbers with ellipsis
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage < maxVisiblePages - 1) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    if (startPage > 1) {
        pages.push(`
            <li class="page-item">
                <a class="page-link" href="#" onclick="handlePageChange(1); return false;">1</a>
            </li>
        `);
        if (startPage > 2) {
            pages.push(`<li class="page-item disabled"><span class="page-link">...</span></li>`);
        }
    }

    for (let i = startPage; i <= endPage; i++) {
        pages.push(`
            <li class="page-item ${i === currentPage ? 'active' : ''}">
                <a class="page-link" href="#" onclick="handlePageChange(${i}); return false;">${i}</a>
            </li>
        `);
    }

    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            pages.push(`<li class="page-item disabled"><span class="page-link">...</span></li>`);
        }
        pages.push(`
            <li class="page-item">
                <a class="page-link" href="#" onclick="handlePageChange(${totalPages}); return false;">${totalPages}</a>
            </li>
        `);
    }

    // Next button
    pages.push(`
        <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="handlePageChange(${currentPage + 1}); return false;">
                <i class="bi bi-chevron-right"></i>
            </a>
        </li>
    `);

    paginationControls.innerHTML = pages.join('');
}

function updatePaginationInfo() {
    const totalItems = filteredProducts.length;
    const start = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
    const end = Math.min(currentPage * itemsPerPage, totalItems);

    document.getElementById('paginationInfo').innerHTML = `
        <i class="bi bi-info-circle"></i> Showing <strong>${start}</strong> to <strong>${end}</strong> of <strong>${totalItems}</strong> products
    `;
}

// ==================== FEATURE FUNCTIONS ====================

// Search Functionality
function handleSearch(query) {
    const searchTerm = query.toLowerCase().trim();

    if (searchTerm === '') {
        filteredProducts = [...allProducts];
    } else {
        filteredProducts = allProducts.filter(product =>
            product.title.toLowerCase().includes(searchTerm)
        );
    }

    // Reapply sorting if active
    if (sortOrder.field && sortOrder.direction) {
        applySorting();
    }

    currentPage = 1; // Reset to first page
    renderTable();
    renderPagination();
    updatePaginationInfo();
}

// Sorting Functionality
function handleSort(field) {
    const btn = document.getElementById(`sort${capitalize(field)}Btn`);

    // Remove active class from other button
    document.querySelectorAll('.sort-btn').forEach(b => {
        if (b !== btn) {
            b.classList.remove('active');
            b.innerHTML = '<i class="bi bi-arrow-down-up"></i>';
        }
    });

    if (sortOrder.field === field) {
        // Toggle through: asc -> desc -> none
        if (sortOrder.direction === 'asc') {
            sortOrder.direction = 'desc';
            btn.innerHTML = '<i class="bi bi-sort-down"></i>';
            btn.classList.add('active');
        } else if (sortOrder.direction === 'desc') {
            sortOrder.direction = null;
            sortOrder.field = null;
            btn.innerHTML = '<i class="bi bi-arrow-down-up"></i>';
            btn.classList.remove('active');
        } else {
            sortOrder.direction = 'asc';
            btn.innerHTML = '<i class="bi bi-sort-up"></i>';
            btn.classList.add('active');
        }
    } else {
        // New field, start with ascending
        sortOrder.field = field;
        sortOrder.direction = 'asc';
        btn.innerHTML = '<i class="bi bi-sort-up"></i>';
        btn.classList.add('active');
    }

    applySorting();
    renderTable();
    renderPagination();
    updatePaginationInfo();
}

function applySorting() {
    if (!sortOrder.field || !sortOrder.direction) {
        return;
    }

    filteredProducts.sort((a, b) => {
        let aValue = a[sortOrder.field];
        let bValue = b[sortOrder.field];

        // Handle string comparison
        if (typeof aValue === 'string') {
            aValue = aValue.toLowerCase();
            bValue = bValue.toLowerCase();
        }

        if (sortOrder.direction === 'asc') {
            return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
        } else {
            return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
        }
    });
}

// Pagination Functionality
function handlePageChange(page) {
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

    if (page < 1 || page > totalPages) {
        return;
    }

    currentPage = page;
    renderTable();
    renderPagination();
    updatePaginationInfo();

    // Scroll to top of table (instant, no animation)
    document.querySelector('.table-container').scrollIntoView({ behavior: 'auto' });
}

function handleItemsPerPageChange(value) {
    itemsPerPage = value;
    currentPage = 1; // Reset to first page
    renderTable();
    renderPagination();
    updatePaginationInfo();
}

// CSV Export Functionality
function exportToCSV() {
    const currentData = getCurrentPageData();

    if (currentData.length === 0) {
        showNotification('No data to export', 'warning');
        return;
    }

    const headers = ['ID', 'Title', 'Price', 'Category', 'Description'];
    const rows = currentData.map(product => [
        product.id,
        `"${escapeCSV(product.title)}"`,
        product.price,
        `"${escapeCSV(product.category?.name || 'N/A')}"`,
        `"${escapeCSV(product.description)}"`
    ]);

    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `products_export_${Date.now()}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showNotification(`Exported ${currentData.length} products successfully!`, 'success');
}

// Detail Modal Functionality
async function showDetailModal(productId) {
    currentProductId = productId;
    isEditMode = false;

    const modal = new bootstrap.Modal(document.getElementById('detailModal'));
    const modalBody = document.getElementById('modalBody');

    // Show loading
    modalBody.innerHTML = '<div class="text-center p-5"><div class="spinner-border text-primary"></div></div>';
    modal.show();

    try {
        const product = await getProductById(productId);
        renderProductDetails(product);

        // Show/hide buttons
        document.getElementById('editBtn').style.display = 'inline-block';
        document.getElementById('saveBtn').style.display = 'none';
        document.getElementById('cancelBtn').style.display = 'none';
    } catch (error) {
        modalBody.innerHTML = `
            <div class="alert alert-danger">
                <i class="bi bi-exclamation-triangle"></i> Failed to load product details
            </div>
        `;
    }
}

function renderProductDetails(product) {
    const modalBody = document.getElementById('modalBody');
    const images = Array.isArray(product.images) ? product.images : [];

    modalBody.innerHTML = `
        <div class="row">
            <div class="col-md-6">
                ${images.length > 0 ? `
                    <div id="productCarousel" class="carousel slide" data-bs-ride="carousel">
                        <div class="carousel-inner">
                            ${images.map((img, index) => `
                                <div class="carousel-item ${index === 0 ? 'active' : ''}">
                                    <img src="${img}" class="product-detail-img" alt="Product image ${index + 1}"
                                         onerror="this.src='https://via.placeholder.com/300?text=No+Image'">
                                </div>
                            `).join('')}
                        </div>
                        ${images.length > 1 ? `
                            <button class="carousel-control-prev" type="button" data-bs-target="#productCarousel" data-bs-slide="prev">
                                <span class="carousel-control-prev-icon"></span>
                            </button>
                            <button class="carousel-control-next" type="button" data-bs-target="#productCarousel" data-bs-slide="next">
                                <span class="carousel-control-next-icon"></span>
                            </button>
                        ` : ''}
                    </div>
                ` : `
                    <img src="https://via.placeholder.com/300?text=No+Image" class="product-detail-img" alt="No image">
                `}
            </div>
            <div class="col-md-6">
                <div class="info-label">Product ID</div>
                <div class="info-value" id="viewId">#${product.id}</div>

                <div class="info-label">Title</div>
                <div class="info-value" id="viewTitle">${escapeHtml(product.title)}</div>

                <div class="info-label">Price</div>
                <div class="info-value" id="viewPrice">$${product.price.toFixed(2)}</div>

                <div class="info-label">Category</div>
                <div class="info-value" id="viewCategory">${escapeHtml(product.category?.name || 'N/A')}</div>

                <div class="info-label">Description</div>
                <div class="info-value" id="viewDescription">${escapeHtml(product.description)}</div>
            </div>
        </div>
    `;
}

function enableEditMode() {
    if (!currentProductId) return;

    isEditMode = true;
    const product = allProducts.find(p => p.id === currentProductId);

    if (!product) return;

    const modalBody = document.getElementById('modalBody');
    const images = Array.isArray(product.images) ? product.images : [];

    modalBody.innerHTML = `
        <form id="editProductForm">
            <div class="row">
                <div class="col-md-6 mb-3">
                    <label class="form-label">Title</label>
                    <input type="text" class="form-control" id="editTitle" value="${escapeHtml(product.title)}" required>
                </div>
                <div class="col-md-6 mb-3">
                    <label class="form-label">Price ($)</label>
                    <input type="number" class="form-control" id="editPrice" value="${product.price}" min="0" step="0.01" required>
                </div>
            </div>
            <div class="mb-3">
                <label class="form-label">Description</label>
                <textarea class="form-control" id="editDescription" rows="3" required>${escapeHtml(product.description)}</textarea>
            </div>
            <div class="mb-3">
                <label class="form-label">Category</label>
                <select class="form-select" id="editCategory" required>
                    ${categories.map(cat => `
                        <option value="${cat.id}" ${product.category?.id === cat.id ? 'selected' : ''}>
                            ${escapeHtml(cat.name)}
                        </option>
                    `).join('')}
                </select>
            </div>
            <div class="mb-3">
                <label class="form-label">Image URLs (comma-separated)</label>
                <textarea class="form-control" id="editImages" rows="2">${images.join(', ')}</textarea>
            </div>
        </form>
    `;

    // Toggle buttons
    document.getElementById('editBtn').style.display = 'none';
    document.getElementById('saveBtn').style.display = 'inline-block';
    document.getElementById('cancelBtn').style.display = 'inline-block';
}

async function saveProduct() {
    if (!currentProductId) return;

    const title = document.getElementById('editTitle').value.trim();
    const price = parseFloat(document.getElementById('editPrice').value);
    const description = document.getElementById('editDescription').value.trim();
    const categoryId = parseInt(document.getElementById('editCategory').value);
    const imagesText = document.getElementById('editImages').value.trim();
    const images = imagesText ? imagesText.split(',').map(url => url.trim()).filter(url => url) : [];

    if (!title || !price || !description || !categoryId) {
        showNotification('Please fill in all required fields', 'warning');
        return;
    }

    const updateData = {
        title,
        price,
        description,
        categoryId,
        images: images.length > 0 ? images : ["https://via.placeholder.com/300"]
    };

    try {
        const updatedProduct = await updateProduct(currentProductId, updateData);

        // Update local data
        const index = allProducts.findIndex(p => p.id === currentProductId);
        if (index !== -1) {
            allProducts[index] = { ...allProducts[index], ...updateData };
            // Update category object
            const category = categories.find(c => c.id === categoryId);
            if (category) {
                allProducts[index].category = category;
            }
        }

        // Re-filter and re-render
        handleSearch(document.getElementById('searchInput').value);

        showNotification('Product updated successfully!', 'success');

        // Close modal
        bootstrap.Modal.getInstance(document.getElementById('detailModal')).hide();
    } catch (error) {
        showNotification('Failed to update product', 'error');
    }
}

function cancelEdit() {
    if (currentProductId) {
        showDetailModal(currentProductId);
    }
}

// Create Product Modal
function showCreateModal() {
    const modal = new bootstrap.Modal(document.getElementById('createModal'));

    // Reset form
    document.getElementById('createProductForm').reset();

    modal.show();
}

function populateCategorySelect() {
    const select = document.getElementById('createCategory');
    select.innerHTML = '<option value="">Select a category...</option>' +
        categories.map(cat => `<option value="${cat.id}">${escapeHtml(cat.name)}</option>`).join('');
}

async function createProduct() {
    const title = document.getElementById('createTitle').value.trim();
    const price = parseFloat(document.getElementById('createPrice').value);
    const description = document.getElementById('createDescription').value.trim();
    const categoryId = parseInt(document.getElementById('createCategory').value);
    const imagesText = document.getElementById('createImages').value.trim();
    const images = imagesText ? imagesText.split(',').map(url => url.trim()).filter(url => url) : ["https://via.placeholder.com/300"];

    if (!title || !price || !description || !categoryId) {
        showNotification('Please fill in all required fields', 'warning');
        return;
    }

    const productData = {
        title,
        price,
        description,
        categoryId,
        images
    };

    try {
        const newProduct = await createNewProduct(productData);

        // Add category object to new product
        const category = categories.find(c => c.id === categoryId);
        if (category) {
            newProduct.category = category;
        }

        // Add to beginning of products array
        allProducts.unshift(newProduct);

        // Re-filter and re-render
        handleSearch(document.getElementById('searchInput').value);

        showNotification('Product created successfully!', 'success');

        // Close modal
        bootstrap.Modal.getInstance(document.getElementById('createModal')).hide();

        // Reset form
        document.getElementById('createProductForm').reset();
    } catch (error) {
        showNotification('Failed to create product', 'error');
    }
}

// Description Tooltip
function showDescription(event, productId) {
    const product = allProducts.find(p => p.id === productId);
    if (!product || !product.description) return;

    const tooltip = document.getElementById('descriptionTooltip');
    tooltip.textContent = product.description;
    tooltip.style.display = 'block';
}

function hideDescription() {
    const tooltip = document.getElementById('descriptionTooltip');
    tooltip.style.display = 'none';
}

// ==================== UTILITY FUNCTIONS ====================
function getCurrentPageData() {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredProducts.slice(start, end);
}

function getProductImage(product) {
    if (Array.isArray(product.images) && product.images.length > 0) {
        return product.images[0];
    }
    return 'https://via.placeholder.com/60?text=No+Image';
}

function showLoading(show) {
    document.getElementById('loadingSpinner').style.display = show ? 'block' : 'none';
    document.getElementById('tableContainer').style.display = show ? 'none' : 'block';
}

function showNotification(message, type = 'success') {
    const toast = document.getElementById('notificationToast');
    const toastMessage = document.getElementById('toastMessage');
    const toastHeader = toast.querySelector('.toast-body');

    toastMessage.textContent = message;

    // Change color based on type
    if (type === 'error') {
        toastHeader.style.background = 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)';
    } else if (type === 'warning') {
        toastHeader.style.background = 'linear-gradient(135deg, #ffd89b 0%, #19547b 100%)';
    } else {
        toastHeader.style.background = 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)';
    }

    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function escapeCSV(text) {
    if (typeof text !== 'string') return text;
    return text.replace(/"/g, '""');
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
