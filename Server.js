import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

app.post("/verify-otp", async (req, res) => {
  try {
    const { accessToken } = req.body;

    if (!accessToken) {
      return res.status(400).json({
        success: false,
        message: "No accessToken received from frontend"
      });
    }

    console.log("Received token:", accessToken);

    const response = await fetch(
      "https://control.msg91.com/api/v5/widget/verifyAccessToken",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "authkey": "494928Au0nEd6H6ws69954685P1"
        },
        body: JSON.stringify({
          "access-token": accessToken
        }),
      }
    );

    const data = await response.json();

    console.log("MSG91 Verify Response:", data);

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

app.listen(5000, () => {
  console.log("Server running on port 5000");
});

