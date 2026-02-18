import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const MSG91_AUTHKEY = process.env.MSG91_AUTHKEY;

app.post("/verify-otp", async (req, res) => {
  try {
    const { accessToken } = req.body;

    if (!accessToken) {
      return res.status(400).json({
        success: false,
        message: "No accessToken received from frontend"
      });
    }

    const response = await fetch(
      "https://control.msg91.com/api/v5/widget/verifyAccessToken",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "authkey": MSG91_AUTHKEY
        },
        body: JSON.stringify({
          "access-token": accessToken
        }),
      }
    );

    const data = await response.json();

    if (data.type === "success") {
      return res.json({ success: true });
    }

    return res.status(401).json({
      success: false,
      message: "OTP verification failed",
      error: data,
    });

  } catch (error) {
    console.log("Server Error:", error);
    res.status(500).json({ success: false });
  }
});

app.listen(process.env.PORT || 5000, () => {
  console.log("Server running...");
});
