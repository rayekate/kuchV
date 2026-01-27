// More comprehensive test for admin registration
const BASE_URL = "http://localhost:3000/api";

async function testAdminRegistration() {
  console.log("=== Admin Registration Feature Test ===\n");

  // Test 1: Register New Admin
  console.log("Test 1: Registering new admin...");
  const adminData = {
    name: "Admin User",
    email: `admin${Date.now()}@test.com`,
    password: "SecureAdmin@123"
  };

  try {
    const registerResponse = await fetch(`${BASE_URL}/auth/admin/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(adminData)
    });

    const registerResult = await registerResponse.json();
    
    if (registerResponse.status === 201) {
      console.log("✅ Admin registered successfully");
      console.log("   Role:", registerResult.user.role);
      console.log("   Email:", registerResult.user.email);
      console.log("   Customer ID:", registerResult.user.customerId);
      console.log("   Access Token:", registerResult.accessToken ? "Generated ✓" : "Missing ✗");
      
      const accessToken = registerResult.accessToken;
      
      // Test 2: Login with admin credentials
      console.log("\nTest 2: Testing admin login...");
      const loginResponse = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: adminData.email,
          password: adminData.password
        })
      });
      
      const loginResult = await loginResponse.json();
      if (loginResponse.ok) {
        console.log("✅ Admin login successful");
        console.log("   No OTP required:", !loginResult.requiresOtp ? "✓" : "✗");
      } else {
        console.log("❌ Admin login failed:", loginResult.message);
      }

      // Test 3: Access protected admin route
      console.log("\nTest 3: Testing admin route access...");
      const adminRouteResponse = await fetch(`${BASE_URL}/admin/stats`, {
        headers: { 
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        }
      });
      
      if (adminRouteResponse.ok) {
        console.log("✅ Admin route access successful");
      } else {
        const error = await adminRouteResponse.json();
        console.log("❌ Admin route access failed:", error.message);
      }

    } else {
      console.log("❌ Registration failed:", registerResult.message);
    }

  } catch (error) {
    console.error("❌ Test error:", error.message);
  }

  console.log("\n=== Test Complete ===");
}

testAdminRegistration();
