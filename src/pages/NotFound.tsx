import React from "react";
import { useNavigate } from "react-router-dom";

const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-800 mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-8">Page not found</p>
        <button
          onClick={() => navigate("/")}
          className="px-6 py-3 bg-[#c16e41] text-white rounded-lg hover:bg-[#a05a32] transition-colors"
        >
          Go Home
        </button>
      </div>
    </div>
  );
};

export default NotFound;
