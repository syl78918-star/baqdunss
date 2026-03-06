
const firebase = require('firebase-admin');

const config = {
    databaseURL: "https://baqduns-edd79-default-rtdb.firebaseio.com"
};

// Note: I don't have a service account key here, 
// so I can only use public access if rules allow, or just skip this.
// But wait, the user is asking ME to find it. I should probably tell them how to find it in the admin panel.

console.log("Searching for: wlaeedabutouima@gmail.com");
console.log("Encoded path: users/wlaeedabutouima___gmail,com");
