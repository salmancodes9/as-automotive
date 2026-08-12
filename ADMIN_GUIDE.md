# Admin Panel Guide - AS Automobiles

## ✅ Quick Start

1. **Sign in** with your admin passcode
2. Navigate between **Products** and **Categories** tabs
3. Add products with images and descriptions
4. Search products to quickly find and edit them

---

## 📋 Product Information Guidelines

### Product Name

- **Be specific**: "Maruti Swift Brake Disc" (not "Brake Part")
- **Include fit**: "Hyundai i20 Headlight Assembly"
- **Use standard terms**: "Alternator", "Water Pump", "Suspension Coil"
- **Avoid keywords**: Don't repeat brand/model in name if already in category

### Price

- Enter in Indian Rupees (₹)
- Must be a positive number
- Leave blank if price varies

### Description

Help customers understand exactly what they're buying:

```
✅ Good example:
"OEM quality brake pads for Maruti Swift 2015-2023 models.
Genuine part with 6-month warranty.
Fitment: All Swift variants.
Includes: 4 brake pads + hardware.
Installation: Professional fitting recommended."
```

**Include:**

- Fitment details (compatible models/years)
- Part condition (new/used/refurbished)
- What's included (single piece, set, with hardware)
- Installation notes if needed
- Warranty information
- Any special features or certifications

### Category

- Select the most appropriate category
- Creates better organization for customers
- Helps with search visibility

### Images

#### Main Image Tips:

- Use **JPG** format for best performance
- Size: 600x600px or 800x800px ideal
- Quality: Clear, well-lit product photos
- Background: White or neutral (consistency helps)
- Show the actual product, not packaging

#### Extra Images (up to 3 more):

- Different angles/close-ups
- Installation view if relevant
- Part details/serial number
- Packaging/documentation

### Badges

- **OEM**: Mark if this is genuine Original Equipment Manufacturer part
- **🔥 Trending**: Mark popular/fast-moving items to feature them

---

## 🖼️ Image Optimization

**For BEST performance:**

1. **Use JPG format** - Reduces file size by 70% vs PNG
2. **Compress before uploading** - Tools:
   - Online: tinypng.com, jpegoptim.com
   - Desktop: ImageOptim (Mac), FastStone (Windows)
3. **Recommended dimensions**: 800x800px or 1024x1024px
4. **Max file size**: 5MB (system enforces this)

**Why this matters:**

- Faster page load = better user experience
- Better mobile performance
- Lower bandwidth costs
- Improved search engine rankings

**Automatic Optimization:**

- Supabase CDN automatically caches images
- Signed URLs stay valid for 10 years
- Images cached globally for fast delivery

---

## 🔍 Managing Products

### Add Product

1. Fill in all required fields (Name at minimum)
2. Upload or paste image URLs
3. Add up to 3 extra gallery images
4. Click "Add Product"
5. Product appears instantly on website

### Edit Product

1. Search for product in list
2. Click "Edit" button
3. Update any field
4. Click "Save Changes"
5. Changes live instantly

### Delete Product

1. Click "Delete" on product
2. Confirm deletion
3. Product removed from website
4. Cannot be undone - use carefully!

### Search & Filter

- Search by product name
- Search by description keywords
- Great for finding products to edit

---

## 📊 Professional Website Comparison

### Our Admin Panel vs Industry Standards:

| Feature         | AS Automobiles | Shopify      | WooCommerce  |
| --------------- | -------------- | ------------ | ------------ |
| Product editing | ✅ Easy modal  | ✅ Full page | ✅ Full page |
| Image gallery   | ✅ Up to 4     | ✅ Unlimited | ✅ Unlimited |
| Bulk editing    | ⏳ Coming soon | ✅ Yes       | ✅ Yes       |
| Search/filter   | ✅ Yes         | ✅ Yes       | ✅ Yes       |
| Category mgmt   | ✅ Simple      | ✅ Advanced  | ✅ Advanced  |
| Form validation | ✅ Yes         | ✅ Yes       | ✅ Yes       |
| Mobile friendly | ✅ Yes         | ✅ Yes       | ✅ Yes       |

**Our Advantages:**

- Lightning-fast (no page reloads)
- Simple to use (no unnecessary features)
- Real-time updates (changes live instantly)
- Free tier (no monthly charges)

---

## 🎯 Best Practices

1. **Always add main image** - Products without images get no clicks
2. **Detailed descriptions = more sales** - Customers buy when informed
3. **Use correct categories** - Helps discovery
4. **Mark OEM correctly** - Customers specifically search for genuine parts
5. **Keep prices accurate** - Update if you change your pricing
6. **Use trending badge wisely** - Only for actual bestsellers
7. **Add extra images** - Gallery images increase conversion 30%+

---

## ⚡ Performance Tips

- ✅ Use compressed images (under 500KB each)
- ✅ Add descriptions with keywords customers search for
- ✅ Complete all product fields for better indexing
- ✅ Use proper category organization
- ✅ Review and update prices quarterly

---

## ❓ FAQ

**Q: How many images can I upload?**
A: 1 main image + 3 extra gallery images = 4 total maximum

**Q: Can I edit categories later?**
A: Yes, categories can be deleted (products stay but lose category)

**Q: How long do image URLs last?**
A: 10 years - you don't need to re-upload

**Q: Can I upload via URL instead of uploading?**
A: Yes, paste any public image URL in the Image URL field

**Q: What file formats work?**
A: JPG, PNG, WebP, GIF. Use JPG for best performance.

**Q: Will customers see my work immediately?**
A: Yes! Everything is live instantly. No "publish" step needed.

---

## 🚀 Future Enhancements

- Bulk product import/export
- Inventory tracking
- Product variants (colors, sizes)
- SEO optimization tools
- Sales analytics
- Email campaigns

---

## 🚀 Deployment Checklist

Before deploying, make sure these items are configured:

1. Run the Supabase migrations so the `product-images` storage bucket exists.
2. Set these environment variables in your host:
   - `SUPABASE_URL`
   - `SUPABASE_PUBLISHABLE_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ADMIN_PASSCODE`
3. Keep the public client variables in sync too:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
4. Verify image uploads by opening the Admin panel and uploading a product image.
5. Rebuild the app after env changes to confirm the production bundle still passes.

Contact support if you need custom features!
