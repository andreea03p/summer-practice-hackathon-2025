import { useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import "./ResetPassword.css";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [data, setData] = useState({
    email: "",
    newPassword: "",
    confirmPassword: "",
  });

  const resetPassword = async (e) => {
    e.preventDefault();
    const { email, newPassword, confirmPassword } = data;

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }

    try {
      // Include confirmPassword in the request body
      const response = await axios.post("/reset-pass", { email, newPassword, confirmPassword });
      const resData = response.data;
      if (resData.error) {
        toast.error(resData.error);
      } else {
        toast.success("Password reset successful.");
        navigate("/login");
      }
    } catch (error) {
      console.error(error);
      toast.error("Reset password failed, please try again.");
    }
  };

  return (
    <div className="reset-page">
      <div className="reset-container">
        <h2>Reset Password</h2>
        <form onSubmit={resetPassword}>
          <label>Email</label>
          <input
            type="email"
            value={data.email}
            onChange={(e) => setData({ ...data, email: e.target.value })}
            required
          />
          <label>New Password</label>
          <input
            type="password"
            value={data.newPassword}
            onChange={(e) => setData({ ...data, newPassword: e.target.value })}
            required
          />
          <label>Confirm New Password</label>
          <input
            type="password"
            value={data.confirmPassword}
            onChange={(e) => setData({ ...data, confirmPassword: e.target.value })}
            required
          />
          <button type="submit" className="reset-btn">
            Reset Password
          </button>
        </form>
      </div>
    </div>
  );
}
