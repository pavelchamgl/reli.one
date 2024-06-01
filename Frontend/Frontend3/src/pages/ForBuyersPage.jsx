import { useState } from "react";

import Container from "../ui/Container/Container";

import styles from "../styles/ForSellerPage.module.scss";

const ForBuyersPage = () => {
  const [section, setSection] = useState("weAre");

  return (
    <Container>
      <div className={styles.main}>
        <p className={styles.title}>Pro kupující</p>
        <div className={styles.container}>
          <div className={styles.linkDivForBuy}>
            <a
              style={{ color: section === "weAre" ? "#3f7f6d" : "#000" }}
              className={styles.linkItem}
              onClick={() => setSection("weAre")}
              href="#weAre"
            >
              1. Marketplace Reli, who we are
            </a>
            <a
              style={{ color: section === "mission" ? "#3f7f6d" : "#000" }}
              onClick={() => setSection("mission")}
              className={styles.linkItem}
              href="#mission"
            >
              1.1.Our Mission
            </a>
            <a
              className={styles.linkItem}
              href="#sets"
              style={{ color: section === "sets" ? "#3f7f6d" : "#000" }}
              onClick={() => setSection("sets")}
            >
              1.2.What Sets Us Apart
            </a>
            <a
              className={styles.linkItem}
              href="#values"
              style={{ color: section === "values" ? "#3f7f6d" : "#000" }}
              onClick={() => setSection("values")}
            >
              1.3.Our Values
            </a>
            <a
              className={styles.linkItem}
              href="#account"
              style={{ color: section === "account" ? "#3f7f6d" : "#000" }}
              onClick={() => setSection("account")}
            >
              2. Account information
            </a>
            <a
              className={styles.linkItem}
              href="#purchase"
              style={{ color: section === "purchase" ? "#3f7f6d" : "#000" }}
              onClick={() => setSection("purchase")}
            >
              3. How to make a purchase
            </a>
            <a
              className={styles.linkItem}
              href="#delivery"
              style={{ color: section === "delivery" ? "#3f7f6d" : "#000" }}
              onClick={() => setSection("delivery")}
            >
              4. Delivery options
            </a>
            <a
              className={styles.linkItem}
              href="#payment"
              style={{ color: section === "payment" ? "#3f7f6d" : "#000" }}
              onClick={() => setSection("payment")}
            >
              5. Payment options
            </a>
          </div>

          <div className={styles.paragDiv}>
            <h4 className={styles.textTitle} id="weAre">
              Who We Are
            </h4>
            <p className={styles.textDesc}>
              At Reli Marketplace, we are dedicated to providing a seamless and
              secure platform for buyers and sellers to connect, transact, and
              thrive. Whether you are looking for unique products, seeking great
              deals, or looking to showcase your own offerings, we are here to
              make your experience exceptional. Marketplace Reli is more than
              just a marketplace – we are a passionate team of innovators, tech
              enthusiasts, and customer advocates. Our diverse team is dedicated
              to creating a trusted, transparent, and user-friendly environment
              for all participants.
            </p>
          </div>

          <div className={styles.paragDiv}>
            <h4 className={styles.textTitle} id="mission">
              Our mission:
            </h4>
            <p className={styles.textDesc}>
              Marketplace Reli is committed to fostering a vibrant community
              where individuals and businesses can discover, buy, and sell with
              confidence. Our mission is to empower entrepreneurs, support small
              businesses, and delight customers by delivering exceptional
              products and services.
            </p>
          </div>

          <div id="sets" className={styles.paragDiv}>
            <h4 className={styles.textTitle}>What Sets Us Apart:</h4>
            <p className={styles.textDesc}>
              TRUST AND SAFETY: we prioritize the security and privacy of our
              users. Our platform employs robust security measures and proactive
              moderation to ensure a safe and trustworthy marketplace.
            </p>
            <p className={styles.textDesc} style={{ margin: "15px 0" }}>
              DIVERSE SELECTION: from handmade crafts to cutting-edge gadgets,
              marketplace Reli offers a diverse range of products from sellers
              around the globe.
            </p>
            <p className={styles.textDesc}>
              EXCEPTIONAL SERVICE: our customer support team is here to assist
              you every step of the way. Whether you have a question, concern,
              or need assistance, we are here to help
            </p>
          </div>

          <div id="values" className={styles.paragDiv}>
            <h4 className={styles.textTitle}>Our Values</h4>
            <p className={styles.textDesc}>
              INTEGRITY: we operate with honesty, transparency, and fairness in
              all our interactions.INNOVATION: we embrace innovation and
              continuously strive to enhance the user experience through
              technology and creativity.
            </p>
            <p className={styles.textDesc} style={{ margin: "15px 0" }}>
              COMMUNITY: we believe in the power of community and foster
              meaningful connections between buyers and sellers.
            </p>
            <p className={styles.textDesc}>
              SUSTAINABILITY: we are committed to environmental sustainability
              and support eco-friendly practices whenever possible.
            </p>
          </div>

          <div id="account" className={styles.accountInfoDiv}>
            <h4 className={styles.textTitle}>Account Information</h4>
            <p className={styles.textDesc}>
              To enjoy a personalized shopping experience and access exclusive
              features, we invite you to create your account. Signing up is
              quick, easy, and free.
            </p>
            <p className={styles.textDesc}>1. Click “Sign up”</p>
            <p className={styles.textDescLight}>
              On our platform click on the “Sign up” or “Register” button.
            </p>
            <p className={styles.textDesc}>2. Provide Your Details</p>
            <p className={styles.textDescLight}>
              Fill out required fields in the registration from, including your
              email address, username, password. We may also ask for additional
              information to help us tailor your experience to your preferences.
            </p>
            <p className={styles.textDesc}>3. Verify Your Email</p>
            <p className={styles.textDescLight}>
              After submitting your registration information, check your email
              inbox for a verification message from us. Click on the
              verification link provided to confirm your email address and
              activate your account.
            </p>
            <p className={styles.textDesc}>4. Complete Your Profile</p>
            <p className={styles.textDescLight}>
              Once your account is activated, take a moment to complete your
              profile.
            </p>
            <p className={styles.textDesc}>5. Start Shopping</p>
            <p className={styles.textDescLight}>
              With your account set up and ready to go, start exploring our
              marketplace. Browse through listings, add items to your cart, and
              enjoy the convenience of secure online shopping.
            </p>
            <p className={styles.textDescLight}>
              Benefits of creating an account:
            </p>
            <p className={styles.textDescLight}>
              a) Personalized Recommendations: receive tailored product
              recommendations based on your browsing and purchase history.
            </p>
            <p className={styles.textDescLight}>
              b) Faster Checkout: save time at checkout by storing your shipping
              and payment information securely in your account.
            </p>
            <p className={styles.textDescLight}>
              c) Order Tracking: keep track of your orders and view their status
              anytime, anywhere.
            </p>
          </div>

          <div className={styles.paragDiv}>
            <h4 className={styles.textTitle}>Security and Privacy:</h4>
            <p className={styles.textDesc}>
              Rest assured that your personal information is safe and secure
              with us. We implement industry-standard security measures to
              protect your data and privacy at all times.
            </p>
          </div>

          <div id="purchase" className={styles.accountInfoDiv}>
            <h4 className={styles.textTitle}>How to make a purchase</h4>
            <p className={styles.textDesc}>
              Follow these simple steps to make a purchase and get your favorite
              items delivered to your doorstep.
            </p>
            <p className={styles.textDesc}>1. Browse Listings:</p>
            <p className={styles.textDescLight}>
              Start by browsing through the listings on our marketplace. Use the
              search bar to find specific items or explore categories to
              discover new products.
            </p>
            <p className={styles.textDesc}>2. Select Your Item:</p>
            <p className={styles.textDescLight}>
              Once you have found the item you want to purchase, click on its
              listing to view more details. Take a moment to read the item
              description, check the seller’s ratings, and review any available
              photos.
            </p>
            <p className={styles.textDesc}>
              3. Add the Item To Your Cart and Review It:
            </p>
            <p className={styles.textDescLight}>
              When you have added items to your cart, review your cart to ensure
              everything looks correct. You can adjust quantities, remove items,
              or apply any available discount codes before proceeding to
              checkout.
            </p>
            <p className={styles.textDesc}>4. Checkout:</p>
            <p className={styles.textDescLight}>
              When you are ready to complete your purchase, click on the
              “Checkout” button.
            </p>
            <p className={styles.textDesc}>5. Provide Shipping Details:</p>
            <p className={styles.textDescLight}>
              Enter your shipping address where you’d like your items to be
              delivered. Make sure to double-check the accuracy of your address
              to avoid any delivery issues.
            </p>
            <p className={styles.textDesc}>6. Choose Payment Method:</p>
            <p className={styles.textDescLight}>
              Select your preferred payment method from the options available.
              We accept a variety of payment methods.
            </p>
            <p className={styles.textDesc}>7. Complete Your Purchase:</p>
            <p className={styles.textDescLight}>
              Follow the on-screen instructions to complete your purchase. If
              required, enter your payment details and confirm your order. Once
              your payment is processed successfully, you will receive an order
              confirmation email.
            </p>
            <p className={styles.textDesc}>8. Track Your Order:</p>
            <p className={styles.textDescLight}>
              You can track the status of your order using the tracking
              information provided in your order confirmation email or by
              logging into your Reli account.
            </p>
          </div>

          <div id="delivery" className={styles.accountInfoDiv}>
            <h4 className={styles.textTitle}>Delivery options</h4>
            <p className={styles.textDesc}>
              At marketplace Reli, we understand that convenience and
              flexibility are essential when it comes to receiving your orders.
              That’s why we offer a variety of delivery options to suit your
              needs. Whether you prefer the convenience of home delivery or the
              flexibility of picking up your order, we have got you covered.
            </p>
            <p className={styles.textDescLight}>COURIER DELIVERY</p>
            <p className={styles.textDesc}>
              Choose from a selection of trusted courier services to have your
              order delivered directly to your doorstep. Enjoy the convenience
              of trackable shipments and reliable delivery times.
            </p>
            <p className={styles.textDescLight}>WAREHOUS PICKUP</p>
            <p className={styles.textDesc}>
              If you want to collect your order in person, opt for our warehouse
              pickup option and retrieve your items at your convenience.
            </p>
            <p className={styles.textDescLight}>INTERNATIONAL SHIPPING</p>
            <p className={styles.textDesc}>
              Our marketplace offers international shipping options to
              destinations around the world.
            </p>
            <p className={styles.textDescLight}>TRACK YOUR ORDER</p>
            <p className={styles.textDesc}>
              Stay inform every step of the way with our order tracking feature.{" "}
            </p>
          </div>

          <div id="payment" className={styles.accountInfoDiv}>
            <h4 className={styles.textTitle}>Payment Options</h4>
            <p className={styles.textDesc}>
              At marketplace Reli, we strive to make the checkout process as
              convenient as possible. That’s why we offer a variety of payment
              options to suit your preferences. Whether you prefer the ease of
              online payments or the flexibility of cash on pickup, we have got
              you covered.
            </p>
            <p className={styles.textDescLight}>ONLINE PAYMENT</p>
            <p className={styles.textDesc}>
              Enjoy the convenience of paying for your purchases securely online
              with your credit or debit card. Our encrypted payment gateway
              ensures that your transactions are safe and protected. Simply
              enter your card details during checkout, and your order will be
              processed swiftly and securely.
            </p>
            <p className={styles.textDescLight}>CASH ON PICKUP</p>
            <p className={styles.textDesc}>
              With our cash on pickup option, you can finalize your payment when
              you collect your order in person. Simply select the payment method
              during checkout. Please note that cash payment are accepted in the
              local currency only.
            </p>
            <p className={styles.textDescLight}>SECURE TRANSACTIONS</p>
            <p className={styles.textDesc}>
              Whether you choose to pay online or in person, rest assured that
              your payment information is protected by industry-standard
              encryption protocols. We take every precaution to ensure that your
              transactions are safe and secure, allowing you to shop with
              confidence on marketplace Reli.
            </p>
            <p className={styles.textDesc}>
              If you have any questions or need assistance, our dedicated
              customer support team is here to help. Contact us at
              <span className={styles.emailText}>
                support600.reli@gmail.com
              </span>
            </p>
          </div>
        </div>
      </div>
    </Container>
  );
};

export default ForBuyersPage;
