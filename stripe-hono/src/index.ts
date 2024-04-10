import { serve } from "@hono/node-server";
import "dotenv/config";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

const app = new Hono();

app.get("/", (c) => {
  const html = `
<!doctype html>
<html>

  <head>
    <title>Checkout</title>
    <script src="https://js.stripe.com/v3/"></script>
  </head>

  <body>
    <h1>Checkout</h1>
    <button id="checkoutButton">Checkout</button>

    <script>
      const checkoutButton = document.getElementById("checkoutButton");
      checkoutButton.addEventListener("click", async () => {
        const response = await fetch("/checkout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });
        const {id} = await response.json();
        // instantiate stripe client. use publishable key 
        const stripe = Stripe("${process.env.STRIPE_PUBLISHABLE_KEY}");
        await stripe.redirectToCheckout({sessionId: id});
      });
    </script>
  </body>

</html>
  `;
  return c.html(html);
});

app.post("/", (c) => {
  return c.text("test POST request");
});

app.post("/checkout", async (c) => {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price: "price_1P418AKGRg4eqambUVIEJYJT",
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: "http://localhost:3000/success",
      cancel_url: "http://localhost:3000/cancel",
    });

    return c.json(session);
  } catch (error: any) {
    console.log(error);
    throw new HTTPException(500, { message: error?.message });
  }
});

app.get("/success", (c) => {
  return c.text("Success!");
});

app.get("/cancel", (c) => {
  return c.text("Canceled!");
});

const port = 3000;
console.log(`Server is running on port ${port}`);

serve({
  fetch: app.fetch,
  port,
});
