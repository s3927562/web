function registerForm() {
    const userType = document.getElementById('userType').value;
    const vendors = document.querySelectorAll('.vendor');
    const customers = document.querySelectorAll('.customer');
    const shippers = document.querySelectorAll('.shipper');
    const registerBtn = document.getElementById('btn-register');

    if (userType == 'vendor') {
        enableElements(vendors);
        disableElements(customers);
        disableElements(shippers);
        registerBtn.removeAttribute('disabled');
    } else if (userType == 'customer') {
        disableElements(vendors);
        enableElements(customers);
        disableElements(shippers);
        registerBtn.removeAttribute('disabled');
    } else if (userType == 'shipper') {
        disableElements(vendors);
        disableElements(customers);
        enableElements(shippers);
        registerBtn.removeAttribute('disabled');
    } else {
        disableElements(vendors);
        disableElements(customers);
        disableElements(shippers);
        registerBtn.setAttribute('disabled', '');
    }
}

function enableElements(elements) {
    elements.forEach(element => {
        element.removeAttribute('hidden');
        if (element.tagName == 'INPUT' || element.tagName == 'SELECT') {
            element.setAttribute('required', '');
        }
    });
}

function disableElements(elements) {
    elements.forEach(element => {
        element.setAttribute('hidden', '');
        if (element.tagName == 'INPUT' || element.tagName == 'SELECT') {
            element.removeAttribute('required');
            element.value = '';
        }
    });
}