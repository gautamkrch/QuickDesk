document.addEventListener('DOMContentLoaded', () => {
    // Initialize mock database in localStorage if it doesn't exist
    if (!localStorage.getItem('quickdesk_db')) {
        localStorage.setItem('quickdesk_db', JSON.stringify({
            users: [],
            tickets: [
                { id: 1, userId: 0, subject: 'Is it a good idea to use AI for a hackathon?', category: 'Technical', description: 'Some description here.', status: 'Open', author: 'Odoo IN Pvt. Ltd.', replies: 21, votes: 21, timestamp: new Date('2025-08-02T12:00:00Z').toISOString() },
                { id: 2, userId: 0, subject: 'Server is down, need urgent assistance.', category: 'Technical', description: 'Some description here.', status: 'In Progress', author: 'Jane Doe', replies: 15, votes: 15, timestamp: new Date('2025-08-01T10:00:00Z').toISOString() },
                { id: 3, userId: 0, subject: 'Billing inquiry for invoice #12345', category: 'Billing', description: 'Some description here.', status: 'Resolved', author: 'John Smith', replies: 5, votes: 5, timestamp: new Date('2025-07-30T15:30:00Z').toISOString() }
            ]
        }));
    }
    if (!localStorage.getItem('currentUser')) {
        localStorage.setItem('currentUser', JSON.stringify(null));
    }

    // Helper functions to interact with localStorage
    const getDb = () => JSON.parse(localStorage.getItem('quickdesk_db'));
    const saveDb = (db) => localStorage.setItem('quickdesk_db', JSON.stringify(db));
    const getCurrentUser = () => JSON.parse(localStorage.getItem('currentUser'));
    const setCurrentUser = (user) => localStorage.setItem('currentUser', JSON.stringify(user));

    const page = window.location.pathname.split('/').pop();
    const currentUser = getCurrentUser();

    // Redirect to login if not authenticated and not on a public page
    if (!currentUser && !['login.html', 'register.html', 'index.html'].includes(page)) {
        window.location.href = 'login.html';
        return;
    }

    // --- Page Specific Logic ---

    if (page === 'login.html') {
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const email = e.target.email.value;
                const password = e.target.password.value;
                const db = getDb();
                const user = db.users.find(u => u.email === email && u.password === password);
                if (user) {
                    setCurrentUser(user);
                    window.location.href = 'dashboard.html';
                } else {
                    alert('Invalid credentials');
                }
            });
        }
    }

    if (page === 'register.html') {
        const registerForm = document.getElementById('register-form');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const fullname = e.target.fullname.value;
                const email = e.target.email.value;
                const password = e.target.password.value;
                const confirmPassword = e.target['confirm-password'].value;

                if (password !== confirmPassword) {
                    alert('Passwords do not match');
                    return;
                }

                const db = getDb();
                if (db.users.find(u => u.email === email)) {
                    alert('An account with this email already exists. Please log in.');
                    return;
                }

                const newUser = { 
                    id: Date.now(), 
                    fullname, 
                    email, 
                    password, 
                    role: 'End User' 
                };
                db.users.push(newUser);
                saveDb(db);
                
                setCurrentUser(newUser);
                
                alert('Registration successful! Redirecting to dashboard...');
                window.location.href = 'dashboard.html';
            });
        }
    }

    if (page === 'dashboard.html' || page === 'my-tickets.html') {
        const ticketList = document.getElementById('ticket-list') || document.getElementById('my-ticket-list');
        
        if (page === 'dashboard.html' && currentUser) {
            const welcomeMessage = document.getElementById('welcome-message');
            if(welcomeMessage) {
                welcomeMessage.textContent = `Hi, ${currentUser.fullname}!`;
            }
        }

        const renderTickets = (ticketsToRender) => {
            if (!ticketList) return;
            ticketList.innerHTML = '';
            ticketsToRender.forEach(ticket => {
                const ticketCard = document.createElement('div');
                ticketCard.className = 'ticket-card';
                ticketCard.innerHTML = `
                    <div class="ticket-header">
                        <a href="#" class="ticket-title">${ticket.subject}</a>
                        <span class="ticket-status ${ticket.status.toLowerCase().replace(' ', '-')}">${ticket.status}</span>
                    </div>
                    <div class="ticket-meta">
                        <span>Category: <strong>${ticket.category}</strong></span>
                        <span>Posted by: <strong>${ticket.author}</strong></span>
                    </div>
                    <div class="ticket-actions">
                        <div class="vote-buttons">
                            <button data-id="${ticket.id}" data-action="upvote">▲</button>
                            <span>${ticket.votes}</span>
                            <button data-id="${ticket.id}" data-action="downvote">▼</button>
                        </div>
                        <span>${ticket.replies} replies</span>
                    </div>
                `;
                ticketList.appendChild(ticketCard);
            });
        };

        const applyFiltersAndSort = () => {
            let db = getDb();
            let tickets = db.tickets;
            
            if (page === 'my-tickets.html') {
                tickets = tickets.filter(t => t.userId === currentUser.id);
            } else {
                const search = document.getElementById('search-input').value.toLowerCase();
                const category = document.getElementById('category-filter').value;
                const status = document.getElementById('status-filter').value;
                const myTickets = document.getElementById('my-tickets-filter').checked;
                const openOnly = document.getElementById('open-only-filter').checked;

                if (search) {
                    tickets = tickets.filter(t => t.subject.toLowerCase().includes(search) || t.description.toLowerCase().includes(search));
                }
                if (category !== 'All') {
                    tickets = tickets.filter(t => t.category === category);
                }
                if (status !== 'All') {
                    tickets = tickets.filter(t => t.status === status);
                }
                if (myTickets) {
                    tickets = tickets.filter(t => t.userId === currentUser.id);
                }
                if (openOnly) {
                    tickets = tickets.filter(t => t.status === 'Open');
                }
            }

            if (page === 'dashboard.html') {
                const sortByMostReplied = document.getElementById('most-replied').checked;
                if (sortByMostReplied) {
                    tickets.sort((a, b) => b.replies - a.replies);
                } else { 
                    tickets.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
                }
            }
            
            renderTickets(tickets);
        };
        
        if (page === 'dashboard.html') {
            document.getElementById('search-input').addEventListener('input', applyFiltersAndSort);
            document.getElementById('category-filter').addEventListener('change', applyFiltersAndSort);
            document.getElementById('status-filter').addEventListener('change', applyFiltersAndSort);
            document.getElementById('my-tickets-filter').addEventListener('change', applyFiltersAndSort);
            document.getElementById('open-only-filter').addEventListener('change', applyFiltersAndSort);
            document.querySelectorAll('input[name="sort"]').forEach(radio => {
                radio.addEventListener('change', applyFiltersAndSort);
            });
        }

        ticketList.addEventListener('click', (e) => {
            if (e.target.dataset.action === 'upvote' || e.target.dataset.action === 'downvote') {
                const ticketId = parseInt(e.target.dataset.id);
                let db = getDb();
                const ticket = db.tickets.find(t => t.id === ticketId);
                if (e.target.dataset.action === 'upvote') {
                    ticket.votes++;
                } else {
                    ticket.votes--;
                }
                saveDb(db);
                applyFiltersAndSort();
            }
        });

        applyFiltersAndSort();
    }

    if (page === 'create-ticket.html') {
        const createTicketForm = document.getElementById('create-ticket-form');
        if (createTicketForm) {
            createTicketForm.addEventListener('submit', (e) => {
                e.preventDefault();
                let db = getDb();
                const newTicket = {
                    id: db.tickets.length > 0 ? Math.max(...db.tickets.map(t => t.id)) + 1 : 1,
                    userId: currentUser.id,
                    subject: e.target.subject.value,
                    category: e.target.category.value,
                    description: e.target.description.value,
                    status: 'Open',
                    author: currentUser.fullname,
                    replies: 0,
                    votes: 0,
                    timestamp: new Date().toISOString()
                };
                db.tickets.push(newTicket);
                saveDb(db);
                alert('Ticket created successfully!');
                window.location.href = 'dashboard.html';
            });
        }
    }

    if (page === 'profile.html') {
        if (currentUser) {
            document.getElementById('profile-name').textContent = currentUser.fullname;
            document.getElementById('profile-email').textContent = currentUser.email;
            document.getElementById('profile-role').textContent = currentUser.role;
        }
    }

    const logoutBtn = document.querySelector('.logout-btn');
    if(logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            setCurrentUser(null);
            window.location.href = 'login.html';
        });
    }
});