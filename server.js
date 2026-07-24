const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// ==========================================
// 🌐 FRONTEND: เสิร์ฟหน้าเว็บ HTML (รวมในไฟล์เดียว)
// ==========================================
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ระบบจัดการสต็อกวัตถุดิบ</title>
    <style>
        :root {
            --border-color: #e2e8f0;
            --text-muted: #64748b;
            --text-main: #1e293b;
            --success: #10b981;
            --danger: #ef4444;
            --radius: 16px;
        }
        body { font-family: 'Sarabun', sans-serif; background: #f8fafc; margin: 0; padding: 20px; color: var(--text-main); }
        .container { max-width: 950px; margin: 0 auto; display: flex; flex-direction: column; gap: 30px; }
        .section { background: white; padding: 24px; border-radius: var(--radius); border: 1px solid var(--border-color); box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05); }
        .table-wrapper { border: 1px solid var(--border-color); border-radius: 12px; overflow: hidden; background: #fff; margin-top: 15px; }
        table { width: 100%; border-collapse: collapse; text-align: left; font-size: 14px; }
        th { background: #f8fafc; padding: 14px 20px; color: var(--text-muted); font-weight: 600; font-size: 13px; text-transform: uppercase; border-bottom: 2px solid var(--border-color); }
        td { padding: 14px 20px; border-bottom: 1px solid var(--border-color); }
        .btn-refresh { background: #f1f5f9; color: var(--text-muted); border: 1px solid var(--border-color); padding: 8px 16px; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 600; }
        .btn-refresh:hover { background: #e2e8f0; }
        .search-input { padding: 8px 14px; border: 1px solid var(--border-color); border-radius: 8px; font-size: 14px; outline: none; width: 220px; }
    </style>
</head>
<body>
    <div class="container">
        
        <!-- ส่วนที่ 1: ประวัติการรับเข้า (IN) -->
        <div class="section">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
                <div>
                    <h2 style="margin: 0 0 4px 0; font-size: 18px;">📥 ประวัติการรับเข้าวัตถุดิบ</h2>
                    <div style="font-size: 13px; color: var(--text-muted);">รายการประวัติการเติมสต็อกวัตถุดิบทั้งหมดในระบบ</div>
                </div>
                <button class="btn-refresh" onclick="loadHistoryInPageData()">🔄 รีเฟรช</button>
            </div>

            <div class="table-wrapper">
                <table>
                    <thead>
                        <tr>
                            <th>วัน-เวลาที่รับเข้า</th>
                            <th>รายการวัตถุดิบ</th>
                            <th>จำนวนที่รับเข้า</th>
                        </tr>
                    </thead>
                    <tbody id="historyInTableBody">
                        <tr><td colspan="3" style="text-align: center; color: var(--text-muted); padding: 30px;">กำลังโหลดประวัติการรับเข้า...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- ส่วนที่ 2: ประวัติการตัดสต็อก / ใช้งาน (OUT) -->
        <div class="section">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
                <h2 style="margin: 0; font-size: 18px; font-weight: 700; color: var(--text-main);">📋 รายการประวัติการตัดสต็อก / ใช้งานทั้งหมด</h2>
                <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                    <input type="text" id="historyOutSearch" placeholder="🔍 ค้นหาชื่อวัตถุดิบ..." onkeyup="filterHistoryOut()" class="search-input">
                    <button onclick="loadHistoryOutPageData()" class="btn-refresh">🔄 รีเฟรช</button>
                </div>
            </div>

            <div class="table-wrapper">
                <table>
                    <thead>
                        <tr>
                            <th>วัน-เวลาที่ทำรายการ</th>
                            <th>ชื่อวัตถุดิบ</th>
                            <th>จำนวนที่ตัดออก</th>
                            <th>หน่วยนับ</th>
                        </tr>
                    </thead>
                    <tbody id="historyOutTableBody">
                        <tr><td colspan="4" style="text-align: center; padding: 30px; color: var(--text-muted);">กำลังโหลดข้อมูลประวัติ...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>

    </div>

    <script>
        const API_URL = window.location.origin;
        let allHistoryOutData = [];

        // 1. โหลดข้อมูลประวัติรับเข้า (IN)
        async function loadHistoryInPageData() {
            const tbodyEl = document.getElementById('historyInTableBody');
            if (!tbodyEl) return;

            try {
                tbodyEl.innerHTML = '<tr><td colspan="3" style="text-align: center; color: var(--text-muted); padding: 30px;">กำลังโหลดประวัติการรับเข้า...</td></tr>';

                const res = await fetch(\`\${API_URL}/api/history/in\`);
                if (!res.ok) throw new Error('ไม่สามารถดึงข้อมูลประวัติได้');
                
                let historyList = await res.json();
                if (!Array.isArray(historyList)) historyList = [];

                tbodyEl.innerHTML = '';

                if (historyList.length === 0) {
                    tbodyEl.innerHTML = '<tr><td colspan="3" style="text-align: center; color: var(--text-muted); padding: 30px;">ยังไม่มีประวัติการรับเข้าวัตถุดิบ</td></tr>';
                    return;
                }

                historyList.forEach(item => {
                    const dateObj = new Date(item.createdAt || item.date || Date.now());
                    const formattedDate = isNaN(dateObj.getTime()) ? '-' : dateObj.toLocaleString('th-TH', {
                        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                    });

                    const ingName = item.Ingredient ? item.Ingredient.name : (item.ingredientName || 'วัตถุดิบ');
                    const unit = item.Ingredient ? item.Ingredient.unit : (item.unit || '');
                    const qty = item.amount !== undefined ? item.amount : (item.quantity || 0);

                    tbodyEl.innerHTML += \`
                        <tr>
                            <td style="color: var(--text-muted);">📅 \${formattedDate}</td>
                            <td><span style="font-weight: 600;">\${ingName}</span></td>
                            <td><strong style="color: var(--success);">+\${qty} \${unit}</strong></td>
                        </tr>\`;
                });

            } catch (error) {
                console.error('โหลดประวัติรับเข้าไม่สำเร็จ:', error);
                if (tbodyEl) {
                    tbodyEl.innerHTML = '<tr><td colspan="3" style="text-align: center; color: var(--danger); padding: 30px;">⚠️ ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์เพื่อโหลดประวัติได้</td></tr>';
                }
            }
        }

        // 2. โหลดข้อมูลประวัติการตัดสต็อก (OUT)
        async function loadHistoryOutPageData() {
            const tbodyEl = document.getElementById('historyOutTableBody');
            if (!tbodyEl) return;
            
            tbodyEl.innerHTML = \`<tr><td colspan="4" style="text-align: center; padding: 30px; color: var(--text-muted);">กำลังโหลดข้อมูลประวัติ...</td></tr>\`;

            try {
                const res = await fetch(\`\${API_URL}/api/history/out\`);
                if (!res.ok) throw new Error('ไม่สามารถดึงข้อมูลประวัติได้');
                
                allHistoryOutData = await res.json();
                if (!Array.isArray(allHistoryOutData)) allHistoryOutData = [];

                renderHistoryOutTable(allHistoryOutData);
            } catch (error) {
                console.error(error);
                tbodyEl.innerHTML = \`<tr><td colspan="4" style="text-align: center; padding: 30px; color: var(--danger);">⚠️ ไม่สามารถเชื่อมต่อเพื่อโหลดข้อมูลได้</td></tr>\`;
            }
        }

        // เรนเดอร์ข้อมูลลงตาราง OUT
        function renderHistoryOutTable(dataList) {
            const tbodyEl = document.getElementById('historyOutTableBody');
            if (!tbodyEl) return;
            
            tbodyEl.innerHTML = '';

            if (dataList.length === 0) {
                tbodyEl.innerHTML = \`<tr><td colspan="4" style="text-align: center; padding: 40px; color: var(--text-muted);">ยังไม่มีประวัติการตัดสต็อกวัตถุดิบ</td></tr>\`;
                return;
            }

            dataList.sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date));

            dataList.forEach(item => {
                const rawDate = item.createdAt || item.date;
                const formattedDate = rawDate ? new Date(rawDate).toLocaleString('th-TH', { 
                    year: 'numeric', month: 'short', day: 'numeric', 
                    hour: '2-digit', minute: '2-digit', second: '2-digit' 
                }) : 'ไม่ระบุเวลา';

                const ingName = item.Ingredient ? item.Ingredient.name : (item.ingredientName || 'ไม่ระบุวัตถุดิบ');
                const unit = item.Ingredient ? item.Ingredient.unit : (item.unit || '');
                const qty = item.amount !== undefined ? item.amount : (item.quantity || 0);

                tbodyEl.innerHTML += \`
                    <tr style="border-bottom: 1px solid var(--border-color); transition: background 0.15s;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='transparent'">
                        <td style="color: var(--text-muted); font-size: 13px;">\${formattedDate}</td>
                        <td style="font-weight: 600; color: var(--text-main);">\${ingName}</td>
                        <td style="color: var(--danger); font-weight: 700;">-\${qty}</td>
                        <td style="color: var(--text-muted);">\${unit}</td>
                    </tr>\`;
            });
        }

        // ฟังก์ชันกรองข้อมูล OUT ตามช่องค้นหา
        function filterHistoryOut() {
            const keyword = document.getElementById('historyOutSearch').value.toLowerCase().trim();
            if (!keyword) {
                renderHistoryOutTable(allHistoryOutData);
                return;
            }

            const filtered = allHistoryOutData.filter(item => {
                const ingName = (item.Ingredient ? item.Ingredient.name : (item.ingredientName || '')).toLowerCase();
                return ingName.includes(keyword);
            });

            renderHistoryOutTable(filtered);
        }

        // เริ่มต้นโหลดข้อมูลเมื่อเปิดหน้าเว็บ
        document.addEventListener('DOMContentLoaded', () => {
            loadHistoryInPageData();
            loadHistoryOutPageData();
        });
    </script>
</body>
</html>
  `);
});


// ==========================================
// 🏷️ 0. API: จัดการประเภทวัตถุดิบ & ประเภทเมนู (CRUD)
// ==========================================

app.get('/api/ingredient-categories', async (req, res) => {
  try {
    const categories = await prisma.ingredientCategory.findMany();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/ingredient-categories', async (req, res) => {
  try {
    const { name } = req.body;
    const category = await prisma.ingredientCategory.create({ data: { name } });
    res.json(category);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/ingredient-categories/:id', async (req, res) => {
  try {
    const { name } = req.body;
    const updated = await prisma.ingredientCategory.update({
      where: { id: Number(req.params.id) },
      data: { name }
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/ingredient-categories/:id', async (req, res) => {
  try {
    await prisma.ingredientCategory.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: "ลบประเภทวัตถุดิบสำเร็จ" });
  } catch (error) {
    res.status(500).json({ error: "ไม่สามารถลบได้เนื่องจากมีวัตถุดิบใช้งานประเภทนี้อยู่" });
  }
});

app.get('/api/product-categories', async (req, res) => {
  try {
    const categories = await prisma.productCategory.findMany();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/product-categories', async (req, res) => {
  try {
    const { name } = req.body;
    const category = await prisma.productCategory.create({ data: { name } });
    res.json(category);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/product-categories/:id', async (req, res) => {
  try {
    const { name } = req.body;
    const updated = await prisma.productCategory.update({
      where: { id: Number(req.params.id) },
      data: { name }
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/product-categories/:id', async (req, res) => {
  try {
    await prisma.productCategory.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: "ลบประเภทเมนูสินค้าสำเร็จ" });
  } catch (error) {
    res.status(500).json({ error: "ไม่สามารถลบได้เนื่องจากมีเมนูสินค้าใช้งานประเภทนี้อยู่" });
  }
});


// ==========================================
// 📦 1. API: วัตถุดิบ (Ingredients)
// ==========================================

app.post('/api/ingredients', async (req, res) => {
  try {
    const { name, categoryId, unit, minAlertLevel } = req.body;
    const ingredient = await prisma.ingredient.create({
      data: { 
        name, 
        categoryId: categoryId ? Number(categoryId) : null, 
        unit, 
        minAlertLevel: minAlertLevel ? Number(minAlertLevel) : 5 
      }
    });
    res.json(ingredient);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/ingredients', async (req, res) => {
  try {
    const ingredients = await prisma.ingredient.findMany({
      include: { category: true }
    });
    const status = ingredients.map(item => ({
      ...item,
      IngredientCategory: item.category,
      isLowStock: item.currentStock <= item.minAlertLevel
    }));
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/ingredients/:id', async (req, res) => {
  try {
    const { name, categoryId, unit, minAlertLevel } = req.body;
    const updated = await prisma.ingredient.update({
      where: { id: Number(req.params.id) },
      data: { 
        name, 
        categoryId: categoryId ? Number(categoryId) : null, 
        unit, 
        minAlertLevel: minAlertLevel ? Number(minAlertLevel) : 5 
      }
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/ingredients/:id', async (req, res) => {
  try {
    const ingredientId = Number(req.params.id);
    await prisma.$transaction(async (tx) => {
      await tx.stockTransaction.deleteMany({ where: { ingredientId } });
      await tx.recipe.deleteMany({ where: { ingredientId } });
      await tx.ingredient.delete({ where: { id: ingredientId } });
    });
    res.json({ message: "ลบวัตถุดิบสำเร็จ" });
  } catch (error) {
    res.status(500).json({ error: "ไม่สามารถลบวัตถุดิบได้เนื่องจากมีข้อมูลที่เกี่ยวข้อง: " + error.message });
  }
});


// ==========================================
// 📥 2. API: รับเข้า / เบิกออก สต็อก
// ==========================================

app.post('/api/ingredients/receive', async (req, res) => {
  const { ingredientId, quantity } = req.body;
  try {
    const result = await prisma.$transaction(async (tx) => {
      const transaction = await tx.stockTransaction.create({
        data: { ingredientId: Number(ingredientId), type: 'IN', amount: Number(quantity), note: 'รับเข้าวัตถุดิบ' }
      });
      const updatedIngredient = await tx.ingredient.update({
        where: { id: Number(ingredientId) },
        data: { currentStock: { increment: Number(quantity) } }
      });
      return { transaction, updatedIngredient };
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "บันทึกรับเข้าไม่สำเร็จ: " + error.message });
  }
});

app.post('/api/inventory/transaction', async (req, res) => {
  const { ingredientId, type, amount, note } = req.body;
  try {
    const result = await prisma.$transaction(async (tx) => {
      const transaction = await tx.stockTransaction.create({
        data: { ingredientId: Number(ingredientId), type, amount: Number(amount), note }
      });
      const stockChange = type === 'OUT' ? -Number(amount) : Number(amount);
      const updatedIngredient = await tx.ingredient.update({
        where: { id: Number(ingredientId) },
        data: { currentStock: { increment: stockChange } }
      });
      return { transaction, updatedIngredient };
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "บันทึกสต็อกไม่สำเร็จ: " + error.message });
  }
});

app.get('/api/inventory/transactions', async (req, res) => {
  try {
    const transactions = await prisma.stockTransaction.findMany({
      include: { ingredient: true },
      orderBy: { createdAt: 'desc' },
      take: 100
    });
    const formatted = transactions.map(t => ({ ...t, Ingredient: t.ingredient }));
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// ==========================================
// ☕ 3. API: สินค้า / เมนู (Products)
// ==========================================

app.post('/api/products', async (req, res) => {
  try {
    const { name, categoryId, price } = req.body;
    const product = await prisma.product.create({ 
      data: { name, categoryId: categoryId ? Number(categoryId) : null, price: Number(price) } 
    });
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/products', async (req, res) => {
  try {
    const products = await prisma.product.findMany({ include: { category: true } });
    const recipes = await prisma.recipe.findMany({ include: { ingredient: true } });

    const formatted = products.map(p => {
      const productRecipes = recipes.filter(r => r.productId === p.id);
      return {
        ...p,
        ProductCategory: p.category,
        Recipes: productRecipes.map(r => ({ ...r, Ingredient: r.ingredient }))
      };
    });
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/products/:id', async (req, res) => {
  try {
    const { name, categoryId, price } = req.body;
    const updated = await prisma.product.update({
      where: { id: Number(req.params.id) },
      data: { name, categoryId: categoryId ? Number(categoryId) : null, price: Number(price) }
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    const productId = Number(req.params.id);
    await prisma.$transaction(async (tx) => {
      await tx.recipe.deleteMany({ where: { productId } });
      await tx.product.delete({ where: { id: productId } });
    });
    res.json({ message: "ลบเมนูสำเร็จ" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// ==========================================
// 🧪 4. API: สูตรชง (Recipes) [แก้ไขให้รองรับโครงสร้างตารางปกติ ป้องกัน Error 500]
// ==========================================

app.get('/api/recipes', async (req, res) => {
  try {
    const recipes = await prisma.recipe.findMany({ include: { ingredient: true, product: true } });
    const formatted = recipes.map(r => ({ ...r, Ingredient: r.ingredient, Product: r.product }));
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/recipes', async (req, res) => {
  try {
    const { productId, ingredientId, quantity, amount, ingredients } = req.body; 
    const valAmount = Number(amount !== undefined ? amount : quantity);

    // กรณีส่งมาเป็นก้อนอาเรย์หลายวัตถุดิบพร้อมกัน
    if (ingredients && Array.isArray(ingredients)) {
      await prisma.$transaction(async (tx) => {
        await tx.recipe.deleteMany({ where: { productId: Number(productId) } });
        const recipeData = ingredients.map(item => ({
          productId: Number(productId),
          ingredientId: Number(item.ingredientId),
          amount: Number(item.amount !== undefined ? item.amount : item.quantity)
        }));
        await tx.recipe.createMany({ data: recipeData });
      });
      return res.json({ message: "บันทึกสูตรสำเร็จ" });
    }

    // กรณีส่งมาทีละรายการ (เช็กก่อนว่ามีอยู่แล้วหรือยัง เพื่อทำการอัปเดตหรือสร้างใหม่)
    const pId = Number(productId);
    const iId = Number(ingredientId);

    const existing = await prisma.recipe.findFirst({
      where: { productId: pId, ingredientId: iId }
    });

    let recipe;
    if (existing) {
      recipe = await prisma.recipe.update({
        where: { id: existing.id },
        data: { amount: valAmount }
      });
    } else {
      recipe = await prisma.recipe.create({
        data: { productId: pId, ingredientId: iId, amount: valAmount }
      });
    }

    res.json({ message: "บันทึกสูตรสำเร็จ", recipe });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/recipes/:id', async (req, res) => {
  try {
    await prisma.recipe.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: "ลบรายการในสูตรสำเร็จ" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// ==========================================
// 🛒 5. API: ปิดร้าน / ตัดสต็อกตามยอดขาย
// ==========================================
app.post('/api/close-shop', async (req, res) => {
  try {
    const { salesItems } = req.body; 
    if (!salesItems || salesItems.length === 0) return res.status(400).json({ error: "ไม่มีรายการยอดขาย" });

    const result = await prisma.$transaction(async (tx) => {
      let ingredientUsage = {}; 
      for (const item of salesItems) {
        const qty = Number(item.quantity);
        if (qty <= 0) continue;
        const recipes = await tx.recipe.findMany({ where: { productId: Number(item.productId) } });
        for (const recipe of recipes) {
          ingredientUsage[recipe.ingredientId] = (ingredientUsage[recipe.ingredientId] || 0) + (recipe.amount * qty);
        }
      }

      let updates = [];
      for (const [ingredientId, totalUsed] of Object.entries(ingredientUsage)) {
        const ingIdNum = Number(ingredientId);
        await tx.stockTransaction.create({
          data: { ingredientId: ingIdNum, type: 'OUT', amount: totalUsed, note: 'ตัดสต็อกปิดร้านประจำวัน' }
        });
        const updatedStock = await tx.ingredient.update({
          where: { id: ingIdNum },
          data: { currentStock: { decrement: totalUsed } }
        });
        updates.push(updatedStock);
      }
      return { message: "ปิดร้านสำเร็จ!", stockStatus: updates };
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// ==========================================
// 📥📤 API: ประวัติการรับเข้า และ เบิกออก
// ==========================================

app.get('/api/history/in', async (req, res) => {
  try {
    const transactions = await prisma.stockTransaction.findMany({
      where: { type: 'IN' },
      include: { ingredient: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(transactions.map(t => ({ ...t, Ingredient: t.ingredient })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/history/out', async (req, res) => {
  try {
    const transactions = await prisma.stockTransaction.findMany({
      where: { type: 'OUT' },
      include: { ingredient: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(transactions.map(t => ({ ...t, Ingredient: t.ingredient })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/stock-transactions', async (req, res) => {
  try {
    const { type } = req.query;
    const transactions = await prisma.stockTransaction.findMany({
      where: type ? { type } : {},
      include: { ingredient: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(transactions.map(t => ({ ...t, Ingredient: t.ingredient })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// เริ่มต้นรัน Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server & Frontend running at http://localhost:${PORT}`);
});
