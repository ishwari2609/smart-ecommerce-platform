const nodemailer = require("nodemailer");

const sendOTP = async (email, otp) => {
  // Local/dev fallback when SMTP is not configured
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn("⚠️ EMAIL_USER/PASS not configured. OTP output to server log for local testing.");
    console.log(`OTP for ${email}: ${otp}`);
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your OTP Code",
      text: `Your OTP is ${otp}`,
    });

    console.log("✅ OTP sent successfully");
  } catch (error) {
    console.error("❌ Email error:", error);
    console.log(`OTP for ${email}: ${otp}`); // fallback for developer testing
    // do not throw; let API continue with OTP in DB
  }
};

sendOTP.sendProductInfo = async (email, product) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn("⚠️ EMAIL_USER/PASS not configured. Product info output to server log for local testing.");
    console.log(`Product info for ${email}:`, JSON.stringify(product));
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const salePrice = product.price - (product.price * (product.discountPercent || 0) / 100);
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: `New Offer: ${product.name}`,
      html: `
        <h2>${product.name}</h2>
        <p>${product.description}</p>
        <p>Original Price: ₹${product.price}</p>
        <p>Discount: ${product.discountPercent || 0}%</p>
        <p>Offer Price: ₹${salePrice.toFixed(2)}</p>
        <p><strong>Apply now before offer ends!</strong></p>
      `,
    });

    console.log("✅ Product mail sent successfully to", email);
  } catch (error) {
    console.error("❌ Product email error:", error);
    console.log(`Product info for ${email}:`, JSON.stringify(product));
  }
};

/**
 * Send personalized recommendations email
 * @param {string} email - Customer email
 * @param {object} recommendations - Recommendation data from recommendationService
 */
sendOTP.sendRecommendations = async (email, recommendations) => {
  if (!recommendations) {
    console.warn("⚠️ Empty recommendations for", email);
    return;
  }

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn("⚠️ EMAIL_USER/PASS not configured. Recommendations output to server log for local testing.");
    console.log(`Recommendations for ${email}:`, JSON.stringify(recommendations, null, 2));
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Build product cards HTML
    const buildProductCard = (product) => `
      <div style="background: #f9f9f9; border: 1px solid #ddd; border-radius: 8px; padding: 15px; margin-bottom: 10px; display: inline-block; width: 45%; margin-right: 2%;">
        <div style="font-weight: bold; font-size: 16px; color: #333; margin-bottom: 8px;">${product.name}</div>
        <div style="font-size: 14px; color: #666; margin-bottom: 8px;">${product.description}</div>
        <div style="margin-bottom: 8px;">
          <span style="font-size: 18px; font-weight: bold; color: #27ae60;">₹${product.price}</span>
          ${product.originalPrice && product.originalPrice > product.price ? `<span style="text-decoration: line-through; color: #999; margin-left: 8px;">₹${product.originalPrice}</span>` : ""}
          ${product.discount > 0 ? `<span style="background: #e74c3c; color: white; padding: 2px 6px; border-radius: 3px; margin-left: 8px; font-size: 12px; font-weight: bold;">${product.discount}% OFF</span>` : ""}
        </div>
        <div style="font-size: 13px; color: ${product.stock > 5 ? "#27ae60" : "#e67e22"};">
          📦 ${product.stock} items in stock
        </div>
        <div style="font-size: 12px; color: #3498db; margin-top: 8px; font-style: italic;">
          ${product.reason}
        </div>
      </div>
    `;

    const recommendedProductsHtml =
      recommendations.wheeledSpecialProducts.length > 0
        ? `
      <h3 style="color: #2c3e50; margin-top: 20px; border-bottom: 2px solid #3498db; padding-bottom: 10px;">
        🎯 Based on Your Watch History
      </h3>
      <p style="color: #555; margin-bottom: 15px;">
        Products in your favorite categories that you haven't seen yet:
      </p>
      <div style="margin-bottom: 20px;">
        ${recommendations.wheeledSpecialProducts.map(buildProductCard).join("")}
      </div>
    `
        : "";

    const wishlistHtml =
      recommendations.wishlishPriceDrops.length > 0
        ? `
      <h3 style="color: #2c3e50; margin-top: 20px; border-bottom: 2px solid #e74c3c; padding-bottom: 10px;">
        ❤️ Your Wishlist Items (Available Now)
      </h3>
      <p style="color: #555; margin-bottom: 15px;">
        Great news! All items in your wishlist are now in stock and ready to buy:
      </p>
      <div style="margin-bottom: 20px;">
        ${recommendations.wishlishPriceDrops.map(buildProductCard).join("")}
      </div>
    `
        : "";

    const newArrivalsHtml =
      recommendations.newStockArrivals.length > 0
        ? `
      <h3 style="color: #2c3e50; margin-top: 20px; border-bottom: 2px solid #27ae60; padding-bottom: 10px;">
        🆕 New Arrivals in Your Favorite Categories
      </h3>
      <p style="color: #555; margin-bottom: 15px;">
        Check out these fresh new items based on your interests:
      </p>
      <div style="margin-bottom: 20px;">
        ${recommendations.newStockArrivals.map(buildProductCard).join("")}
      </div>
    `
        : "";

    const htmlContent = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
          <h1 style="margin: 0; font-size: 24px;">🛍️ Your Personalized Recommendations</h1>
          <p style="margin: 5px 0 0 0; font-size: 14px;">Handpicked products based on your watch history and wishlist, ${recommendations.customerName}!</p>
        </div>

        <!-- Product Recommendations -->
        ${recommendedProductsHtml}
        ${wishlistHtml}
        ${newArrivalsHtml}

        <!-- No Recommendations Message -->
        ${!recommendedProductsHtml && !wishlistHtml && !newArrivalsHtml ? `
          <div style="background: #fff3cd; padding: 15px; border-radius: 6px; margin: 20px 0; text-align: center;">
            <p style="color: #856404; margin: 0;">
              📝 No specific recommendations available yet. Start browsing our products to get personalized suggestions!
            </p>
          </div>
        ` : ""}

        <!-- Bottom CTA -->
        <div style="background: #f9f9f9; padding: 15px; border-radius: 6px; text-align: center; margin-top: 20px;">
          <p style="color: #666; margin-bottom: 12px;">
            <strong>Don't miss out on these great picks!</strong>
          </p>
          <a href="http://localhost:3000" style="background: #667eea; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
            Shop Now
          </a>
        </div>

        <!-- Footer -->
        <div style="text-align: center; color: #999; font-size: 12px; margin-top: 20px; border-top: 1px solid #eee; padding-top: 15px;">
          <p>💌 Recommendations are curated based on your shopping interests to help you find products you love.</p>
          <p>&copy; 2024 Smart Ecommerce Platform. All rights reserved.</p>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: `${recommendations.customerName}, Your Personalized Product Recommendations are Ready! 🎯`,
      html: htmlContent,
    });

    console.log("✅ Recommendation email sent to", email);
  } catch (error) {
    console.error("❌ Recommendation email error:", error);
    console.log(`Recommendations for ${email}:`, JSON.stringify(recommendations, null, 2));
  }
};

/**
 * Send price change alert to customers who wishlisted or watched the product
 * @param {object} product - Product object
 * @param {object} priceChanges - Object with oldPrice, oldDiscount, newPrice, newDiscount
 */
sendOTP.notifyCustomersAboutPriceChange = async (product, priceChanges) => {
  if (!product || !priceChanges) {
    console.warn("⚠️ Invalid price change data");
    return;
  }

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn("⚠️ EMAIL_USER/PASS not configured. Price change notification output to server log.");
    console.log(`Price change for ${product.name}:`, priceChanges);
    return;
  }

  try {
    const User = require("../models/User");
    
    // Find customers who wishlisted this product
    const wishlistCustomers = await User.find({
      role: "customer",
      wishlist: product._id
    }).select("email name");

    // Find customers who watched this product
    const watchHistoryCustomers = await User.find({
      role: "customer",
      "watchHistory.productId": String(product._id)
    }).select("email name");

    // Combine and deduplicate customers
    const customerSet = new Map();
    
    wishlistCustomers.forEach(c => {
      customerSet.set(c.email, { email: c.email, name: c.name });
    });
    
    watchHistoryCustomers.forEach(c => {
      customerSet.set(c.email, { email: c.email, name: c.name });
    });

    const customers = Array.from(customerSet.values());

    if (customers.length === 0) {
      console.log(`ℹ️ No customers to notify about price change for ${product.name}`);
      return;
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Calculate old and new prices
    const oldSalePrice = priceChanges.oldPrice - (priceChanges.oldPrice * (priceChanges.oldDiscount || 0) / 100);
    const newSalePrice = priceChanges.newPrice - (priceChanges.newPrice * (priceChanges.newDiscount || 0) / 100);
    const priceChangePercent = (((oldSalePrice - newSalePrice) / oldSalePrice) * 100).toFixed(1);
    
    // Determine price and discount status
    const priceReduced = newSalePrice < oldSalePrice;
    const discountIncreased = priceChanges.newDiscount > priceChanges.oldDiscount;
    const priceChangeAmount = Math.abs(oldSalePrice - newSalePrice).toFixed(2);
    const discountChangeAmount = Math.abs(priceChanges.newDiscount - priceChanges.oldDiscount);
    
    // Set header color based on price change
    const headerColor = priceReduced ? 'linear-gradient(135deg, #27ae60 0%, #229954 100%)' : 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)';
    const priceStatusText = priceReduced ? '✅ PRICE REDUCED' : '⚠️ PRICE INCREASED';
    const discountStatusText = discountIncreased ? '📈 DISCOUNT INCREASED' : '📉 DISCOUNT DECREASED';

    // Send email to each customer
    for (const customer of customers) {
      const htmlContent = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px;">
          <!-- Header -->
          <div style="background: ${headerColor}; color: white; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
            <h1 style="margin: 0; font-size: 24px;">💰 Price Update Alert!</h1>
            <p style="margin: 5px 0 0 0; font-size: 14px;">Important change on an item you're interested in</p>
          </div>

          <!-- Product Section -->
          <div style="background: #f9f9f9; border: 3px solid ${priceReduced ? '#27ae60' : '#e74c3c'}; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
            <h2 style="color: #2c3e50; margin-top: 0;">${product.name}</h2>
            <p style="color: #666; margin-bottom: 15px;">${product.description || 'Premium quality product'}</p>

            <!-- Status Badge -->
            <div style="text-align: center; margin-bottom: 15px;">
              <span style="background: ${priceReduced ? '#27ae60' : '#e74c3c'}; color: white; padding: 10px 20px; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block;">
                ${priceStatusText}
              </span>
            </div>

            <!-- Price Comparison -->
            <div style="background: white; padding: 15px; border-radius: 6px; margin-bottom: 15px;">
              <div style="display: flex; justify-content: space-around; align-items: center;">
                <!-- Old Price -->
                <div style="text-align: center;">
                  <p style="color: #999; margin: 0 0 5px 0; font-size: 12px;">Previous Price</p>
                  <p style="text-decoration: line-through; color: #999; margin: 0; font-size: 18px;">₹${oldSalePrice.toFixed(2)}</p>
                </div>
                
                <!-- Arrow -->
                <div style="color: ${priceReduced ? '#27ae60' : '#e74c3c'}; font-size: 24px;">→</div>
                
                <!-- New Price -->
                <div style="text-align: center;">
                  <p style="color: ${priceReduced ? '#27ae60' : '#e74c3c'}; margin: 0 0 5px 0; font-size: 12px;"><strong>New Price</strong></p>
                  <p style="color: ${priceReduced ? '#27ae60' : '#e74c3c'}; margin: 0; font-size: 28px; font-weight: bold;">₹${newSalePrice.toFixed(2)}</p>
                </div>
              </div>

              <!-- Price Change Amount -->
              <div style="text-align: center; margin-top: 12px;">
                <span style="background: ${priceReduced ? '#d5f4e6' : '#fadbd8'}; color: ${priceReduced ? '#27ae60' : '#e74c3c'}; padding: 8px 16px; border-radius: 20px; font-weight: bold; display: inline-block;">
                  ${priceReduced ? '✅' : '⚠️'} ${priceReduced ? 'SAVE' : 'INCREASE'} ₹${priceChangeAmount}
                </span>
              </div>
            </div>

            <!-- Discount and Stock Info -->
            <div style="background: #f0f4f8; padding: 15px; border-radius: 6px; margin-bottom: 15px;">
              <!-- Old Discount Info -->
              <div style="margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid #ddd;">
                <p style="margin: 0; color: #666; font-size: 13px;"><strong>Previous Discount:</strong> ${priceChanges.oldDiscount || 0}%</p>
              </div>
              
              <!-- New Discount Status -->
              <div style="background: ${discountIncreased ? '#d5f4e6' : '#fadbd8'}; padding: 10px; border-radius: 6px; margin-bottom: 10px;">
                <p style="margin: 0; color: ${discountIncreased ? '#27ae60' : '#e74c3c'}; font-weight: bold;">
                  ${discountStatusText}
                </p>
                <p style="margin: 5px 0 0 0; color: ${discountIncreased ? '#27ae60' : '#e74c3c'};">${discountIncreased ? '+' : '-'}${discountChangeAmount}% (Now: ${priceChanges.newDiscount || 0}%)</p>
              </div>
              
              <!-- Stock Info -->
              <p style="margin: 0; color: #27ae60;"><strong>📦 Stock:</strong> ${product.quantity || 100} items available</p>
            </div>

            <!-- CTA -->
            <a href="http://localhost:3000/product/${product._id}" style="display: block; background: ${priceReduced ? 'linear-gradient(135deg, #27ae60 0%, #229954 100%)' : 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)'}; color: white; padding: 14px 20px; text-decoration: none; border-radius: 6px; text-align: center; font-weight: bold; margin-top: 15px;">
              View Product & Buy Now 🛒
            </a>
          </div>

          <!-- Footer -->
          <div style="text-align: center; color: #999; font-size: 12px; margin-top: 20px; border-top: 1px solid #eee; padding-top: 15px;">
            <p>We noticed you're interested in this product, so we wanted to let you know about this great deal!</p>
            <p>&copy; 2024 Smart Ecommerce Platform. All rights reserved.</p>
          </div>
        </div>
      `;

      try {
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: customer.email,
          subject: `${product.name} - Price Updated! 💰 Now Just ₹${newSalePrice.toFixed(0)}`,
          html: htmlContent,
        });
        console.log(`✅ Price change notification sent to ${customer.email}`);
      } catch (emailErr) {
        console.error(`❌ Failed to send to ${customer.email}:`, emailErr.message);
      }
    }

    console.log(`✅ Price change notifications sent to ${customers.length} customers`);
  } catch (error) {
    console.error("❌ Price change notification error:", error);
  }
};

/**
 * Notify users about product back in stock from wishlist
 * @param {object} product - Product that is now back in stock
 * @param {array} users - Users with this product in their wishlist
 */
sendOTP.notifyUsersAboutStockAvailability = async (product, users) => {
  if (!users || users.length === 0) {
    console.log("📭 No users to notify about stock availability");
    return;
  }

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn("⚠️ EMAIL_USER/PASS not configured. Stock notification output to server log.");
    console.log(`Stock Availability for ${product.name}:`, JSON.stringify({ users: users.map(u => u.email), product: product.name }));
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const salePrice = product.price - (product.price * (product.discountPercent || 0) / 100);

    for (const customer of users) {
      const htmlContent = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #27ae60 0%, #229954 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
            <h1 style="margin: 0; font-size: 24px;">✅ Product Back in Stock!</h1>
            <p style="margin: 5px 0 0 0; font-size: 14px;">Great news, ${customer.name}! An item from your wishlist is now available.</p>
          </div>

          <!-- Product Card -->
          <div style="background: #f9f9f9; border: 2px solid #27ae60; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
            <h2 style="color: #2c3e50; margin-top: 0;">${product.name}</h2>
            <p style="color: #555; line-height: 1.6;">${product.description || ''}</p>
            
            <!-- Price Display -->
            <div style="background: white; padding: 15px; border-radius: 6px; margin: 15px 0;">
              <div style="display: flex; align-items: center; justify-content: center; gap: 20px;">
                <div style="text-align: center;">
                  <p style="color: #999; margin: 0 0 5px 0; font-size: 12px;">Current Price</p>
                  <p style="color: #27ae60; margin: 0; font-size: 28px; font-weight: bold;">₹${salePrice.toFixed(2)}</p>
                </div>
                ${product.discountPercent > 0 ? `
                <div style="background: #e74c3c; color: white; padding: 8px 16px; border-radius: 20px; text-align: center;">
                  <p style="margin: 0; font-size: 14px; font-weight: bold;">${product.discountPercent}% OFF</p>
                </div>
                ` : ''}
              </div>
            </div>

            <!-- Stock Info -->
            <div style="background: #d5f4e6; padding: 12px; border-radius: 6px; margin-bottom: 12px; text-align: center;">
              <p style="margin: 0; color: #27ae60; font-weight: bold;">📦 ${product.quantity || 100} items in stock</p>
            </div>

            <!-- Product Category -->
            <p style="color: #3498db; margin-bottom: 10px;"><strong>Category:</strong> ${product.category}</p>
            <p style="color: #7f8c8d; font-size: 14px;"><strong>Company:</strong> ${product.company}</p>

            <!-- CTA Button -->
            <a href="http://localhost:3000/product/${product._id}" style="display: block; background: linear-gradient(135deg, #27ae60 0%, #229954 100%); color: white; padding: 14px 20px; text-decoration: none; border-radius: 6px; text-align: center; font-weight: bold; margin-top: 15px; font-size: 16px;">
              Shop Now 🛒
            </a>
          </div>

          <!-- Info Box -->
          <div style="background: #f0f4f8; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
            <p style="margin: 0; color: #555;">
              ⏰ <strong>Hurry!</strong> Stock items are selling fast. Make sure to add this product to your cart before it goes out of stock again.
            </p>
          </div>

          <!-- Footer -->
          <div style="text-align: center; color: #999; font-size: 12px; border-top: 1px solid #eee; padding-top: 15px;">
            <p>&copy; 2024 Smart Ecommerce Platform. All rights reserved.</p>
          </div>
        </div>
      `;

      try {
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: customer.email,
          subject: `🎉 ${product.name} is Back in Stock! Your Wishlist Item is Available`,
          html: htmlContent,
        });
        console.log(`✅ Stock availability notification sent to ${customer.email}`);
      } catch (emailErr) {
        console.error(`❌ Failed to send stock notification to ${customer.email}:`, emailErr.message);
      }
    }

    console.log(`✅ Stock availability notifications sent to ${users.length} users`);
  } catch (error) {
    console.error("❌ Stock availability notification error:", error);
  }
};

module.exports = sendOTP;