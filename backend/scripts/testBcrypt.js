require('dotenv').config();
const bcrypt = require('bcryptjs');

async function testHashed() {
  const match = await bcrypt.compare('testpassword123', '$2b$10$kvpHZjGaikfrQLaTTA7nz.ou998hICcoIBzI56hivsXqPyW2mKHWS');
  console.log(match);
}
testHashed();
