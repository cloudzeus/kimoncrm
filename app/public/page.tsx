export default function PublicPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold text-center mb-6">🚀 CRM System Ready!</h1>
        
        <div className="space-y-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <h2 className="font-semibold text-green-800">✅ Setup Complete</h2>
            <p className="text-green-700 text-sm mt-1">
              All core systems have been configured successfully!
            </p>
          </div>
          
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h2 className="font-semibold text-blue-800">🔐 Admin Access</h2>
            <p className="text-blue-700 text-sm mt-1">
              Login: <code className="bg-blue-100 px-2 py-1 rounded">gkozyris@gmail.com</code>
            </p>
            <p className="text-blue-700 text-sm mt-1">
              Password: <code className="bg-blue-100 px-2 py-1 rounded">72541969</code>
            </p>
          </div>
          
          <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <h2 className="font-semibold text-purple-800">🚀 Ready to Use</h2>
            <p className="text-purple-700 text-sm mt-1">
              Your CRM is ready for development with all features enabled!
            </p>
          </div>
          
          <a 
            href="/sign-in" 
            className="block w-full bg-blue-600 text-white text-center py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Login
          </a>
        </div>
      </div>
    </div>
  );
}

