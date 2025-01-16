import { useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import apiClient from '../api/apiClient';

function ResendConfirmationPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleResend = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await apiClient.post('/auth/resend-confirmation', { email });
      toast.success(response.data.message || 'Confirmation email sent successfully.');
      setEmail('');
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to send confirmation email.';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <form onSubmit={handleResend} className="bg-white p-6 rounded shadow-md w-80">
        <h1 className="text-lg font-bold mb-4">Resend Confirmation Email</h1>
        <div className="mb-4">
          <label className="block font-bold">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="Enter your email"
            required
          />
        </div>
        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded shadow mt-4 w-full"
          disabled={loading}
        >
          {loading ? 'Sending...' : 'Resend Email'}
        </button>
      </form>
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}

export default ResendConfirmationPage;
