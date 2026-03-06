
// ========= AUCTION MESSAGING SYSTEM =========
function openAuctionMessaging(orderIndex) {
    const orders = JSON.parse(localStorage.getItem('baqdouns_orders') || '[]');
    const order = orders[orderIndex];

    if (!order || order.type !== 'Auction Win') {
        alert('This is not an auction order.');
        return;
    }

    // Create modal
    const modalHTML = `
                    <div id="messaging-modal" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.7); z-index:10000; display:flex; justify-content:center; align-items:center;">
                        <div style="background:white; width:90%; max-width:600px; max-height:80%; border-radius:12px; overflow:hidden; display:flex; flex-direction:column;">
                            <div style="background:#041E42; color:white; padding:20px; display:flex; justify-content:space-between; align-items:center;">
                                <div>
                                    <h2 style="margin:0 0 5px 0; font-size:1.3rem;">💬 Message Auction Winner</h2>
                                    <p style="margin:0; font-size:0.9rem; opacity:0.9;">Order: ${order.id} | Winner: ${order.userName}</p>
                                </div>
                                <button onclick="closeMessagingModal()" style="background:transparent; border:none; color:white; font-size:2rem; cursor:pointer; padding:0; line-height:1;">&times;</button>
                            </div>
                            
                            <div id="messages-container" style="flex:1; overflow-y:auto; padding:20px; background:#f5f5f5;">
                                <!-- Messages will be inserted here -->
                            </div>
                            
                            <div style="padding:15px; background:white; border-top:1px solid #ddd;">
                                <div style="display:flex; gap:10px;">
                                    <input type="text" id="message-input" placeholder="Type account details or message..." 
                                        style="flex:1; padding:12px; border:2px solid #ddd; border-radius:8px; font-size:1rem;"
                                        onkeypress="if(event.key==='Enter') sendAuctionMessage(${orderIndex})">
                                    <button onclick="sendAuctionMessage(${orderIndex})" 
                                        style="background:#2ecc71; color:white; border:none; padding:12px 24px; border-radius:8px; cursor:pointer; font-weight:bold; font-size:1rem;">
                                        Send
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    loadMessages(orderIndex);
    document.getElementById('message-input').focus();
}

function loadMessages(orderIndex) {
    const orders = JSON.parse(localStorage.getItem('baqdouns_orders') || '[]');
    const order = orders[orderIndex];
    const messages = order.messages || [];

    const container = document.getElementById('messages-container');

    if (messages.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#999; padding:40px 0;">No messages yet. Start the conversation!</p>';
        return;
    }

    container.innerHTML = messages.map(msg => {
        const isAdmin = msg.sender === 'Admin';
        const bgColor = isAdmin ? '#041E42' : '#2ecc71';
        const alignment = isAdmin ? 'flex-end' : 'flex-start';

        return `
                        <div style="display:flex; justify-content:${alignment}; margin-bottom:15px;">
                            <div style="max-width:70%; background:${bgColor}; color:white; padding:12px 16px; border-radius:12px;">
                                <div style="font-weight:bold; font-size:0.9rem; margin-bottom:5px; opacity:0.9;">${msg.sender}</div>
                                <div style="font-size:1rem; line-height:1.4;">${msg.text}</div>
                                <div style="font-size:0.75rem; margin-top:5px; opacity:0.7;">${new Date(msg.timestamp).toLocaleString()}</div>
                            </div>
                        </div>
                    `;
    }).join('');

    // Scroll to bottom
    container.scrollTop = container.scrollHeight;
}

function sendAuctionMessage(orderIndex) {
    const input = document.getElementById('message-input');
    const text = input.value.trim();

    if (!text) return;

    const orders = JSON.parse(localStorage.getItem('baqdouns_orders') || '[]');
    const order = orders[orderIndex];

    if (!order.messages) order.messages = [];

    order.messages.push({
        sender: 'Admin',
        text: text,
        timestamp: new Date().toISOString()
    });

    orders[orderIndex] = order;
    localStorage.setItem('baqdouns_orders', JSON.stringify(orders));

    input.value = '';
    loadMessages(orderIndex);
}

function closeMessagingModal() {
    const modal = document.getElementById('messaging-modal');
    if (modal) modal.remove();
}
