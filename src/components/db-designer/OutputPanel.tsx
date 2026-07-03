import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, Code2, Server, TerminalSquare, Database } from "lucide-react";
import JSZip from "jszip";

type Tab = "mongoose" | "prisma" | "sql" | "express" | "fastapi" | "seed";

export default function OutputPanel({ tables, relations, onClose }: any) {
  const [activeTab, setActiveTab] = useState<Tab>("mongoose");

  const generateMongoose = () => {
    return tables.map((t: any) => {
      // Find relationships to inject Mongoose references
      const foreignKeys = relations
        .filter((r: any) => r.fromTable === t.id || r.fromTable === t.name)
        .map((r: any) => {
          const targetTable = tables.find((tbl: any) => tbl.id === r.toTable || tbl.name === r.toTable);
          return targetTable ? `  ${r.fromColumn}: { type: mongoose.Schema.Types.ObjectId, ref: '${targetTable.name}' }` : null;
        }).filter(Boolean);

      const columns = t.columns.map((c: any) => {
        // Skip if this column is a foreign key we already handled
        if (foreignKeys.some((fk: string) => fk.includes(`  ${c.name}:`))) return null;
        let comment = '';
        if (c.isPK) comment = ' // PRIMARY KEY: Indexed by default for O(log N) fast lookups.';
        else if (c.isUnique) comment = ' // UNIQUE INDEX: Enforces data integrity and provides O(log N) retrieval.';
        else if (c.name.toLowerCase().includes('status') || c.name.toLowerCase().includes('role')) comment = ' // ENUM CANDIDATE: Restrict this string to prevent invalid states.';
        else if (c.type === 'String' && !c.isNotNull) comment = ' // OPTIONAL FIELD: Reduces storage but requires null-checking in app logic.';
        else if (c.type === 'String' && c.isNotNull) comment = ' // REQUIRED: Enforced at the schema level to avoid corrupted records.';
        return `  ${c.name}: { type: ${c.type}${c.isUnique ? ', unique: true' : ''}${c.isNotNull ? ', required: true' : ''} },${comment}`;
      }).filter(Boolean);

      const allFields = [...columns, ...foreignKeys].join(",\n");
      
      return `const ${t.name}Schema = new mongoose.Schema({\n${allFields}\n}, { timestamps: true });\n\nexport const ${t.name} = mongoose.model('${t.name}', ${t.name}Schema);`;
    }).join("\n\n");
  };

  const generateExpress = () => {
    return tables.map((t: any) => {
      // Generate populate strings for GET requests
      const outgoingRels = relations.filter((r: any) => r.fromTable === t.id || r.fromTable === t.name);
      const populates = outgoingRels.map((r: any) => {
        const targetTable = tables.find((tbl: any) => tbl.id === r.toTable || tbl.name === r.toTable);
        return targetTable ? `.populate('${r.fromColumn}')` : '';
      }).join('');

      return `// routes/${t.name.toLowerCase()}Routes.js
import express from 'express';
import { ${t.name} } from '../models/${t.name}.js';
// import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route   GET /api/${t.name.toLowerCase()}
 * @desc    Get all ${t.name} (with pagination and relations)
 * @access  Public/Private
 */
router.get('/', /* authMiddleware, */ async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const data = await ${t.name}.find()
      ${populates ? populates + '\n      ' : ''}.skip(skip)
      .limit(limit);
      
    const total = await ${t.name}.countDocuments();

    res.json({
      success: true,
      count: data.length,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      data
    });
  } catch (err) {
    next(err);
  }
});

/**
 * @route   GET /api/${t.name.toLowerCase()}/:id
 * @desc    Get single ${t.name}
 */
router.get('/:id', async (req, res, next) => {
  try {
    const data = await ${t.name}.findById(req.params.id)${populates};
    if (!data) return res.status(404).json({ success: false, error: 'Resource not found' });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

/**
 * @route   POST /api/${t.name.toLowerCase()}
 * @desc    Create new ${t.name}
 */
router.post('/', async (req, res, next) => {
  try {
    const data = await ${t.name}.create(req.body);
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

/**
 * @route   PUT /api/${t.name.toLowerCase()}/:id
 * @desc    Update ${t.name}
 */
router.put('/:id', async (req, res, next) => {
  try {
    const data = await ${t.name}.findByIdAndUpdate(req.params.id, req.body, { 
      new: true, 
      runValidators: true 
    });
    if (!data) return res.status(404).json({ success: false, error: 'Resource not found' });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

/**
 * @route   DELETE /api/${t.name.toLowerCase()}/:id
 * @desc    Delete ${t.name}
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const data = await ${t.name}.findByIdAndDelete(req.params.id);
    if (!data) return res.status(404).json({ success: false, error: 'Resource not found' });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;`;
    }).join("\n\n// " + "=".repeat(60) + "\n\n");
  };

  const generatePrisma = () => {
    let schema = `generator client {\n  provider = "prisma-client-js"\n}\n\ndatasource db {\n  provider = "postgresql"\n  url      = env("DATABASE_URL")\n}\n\n`;
    tables.forEach((t: any) => {
      schema += `model ${t.name} {\n`;
      t.columns.forEach((c: any) => {
        let pType = c.type === 'String' ? 'String' : c.type === 'Number' ? 'Int' : c.type === 'Boolean' ? 'Boolean' : c.type === 'Date' ? 'DateTime' : 'String';
        if (c.isPK) schema += `  ${c.name} ${pType} @id @default(autoincrement())\n`;
        else schema += `  ${c.name} ${pType}${c.isUnique ? ' @unique' : ''}${c.isNotNull ? '' : '?'}\n`;
      });
      relations.filter((r: any) => r.fromTable === t.id || r.fromTable === t.name).forEach((r: any) => {
         const targetTable = tables.find((tbl: any) => tbl.id === r.toTable || tbl.name === r.toTable);
         if (targetTable) {
           schema += `  ${r.fromColumn} Int\n  ${targetTable.name.toLowerCase()} ${targetTable.name} @relation(fields: [${r.fromColumn}], references: [id])\n`;
         }
      });
      schema += `}\n\n`;
    });
    return schema;
  };

  const generateSQL = () => {
    return tables.map((t: any) => {
      let schema = `CREATE TABLE ${t.name} (\n`;
      const cols = t.columns.map((c: any) => {
        let pType = c.type === 'String' ? 'VARCHAR(255)' : c.type === 'Number' ? 'INT' : c.type === 'Boolean' ? 'BOOLEAN' : c.type === 'Date' ? 'TIMESTAMP' : 'VARCHAR(255)';
        let attrs = [];
        if (c.isPK) attrs.push('PRIMARY KEY');
        if (c.isUnique) attrs.push('UNIQUE');
        if (c.isNotNull) attrs.push('NOT NULL');
        return `  ${c.name} ${pType} ${attrs.join(' ')}`.trimEnd();
      });
      
      relations.filter((r: any) => r.fromTable === t.id || r.fromTable === t.name).forEach((r: any) => {
         const targetTable = tables.find((tbl: any) => tbl.id === r.toTable || tbl.name === r.toTable);
         if (targetTable) {
           cols.push(`  FOREIGN KEY (${r.fromColumn}) REFERENCES ${targetTable.name}(id) ON DELETE CASCADE`);
         }
      });
      schema += cols.join(',\n') + `\n);`;
      return schema;
    }).join("\n\n");
  };

  const generateSeedData = () => {
    const data: any = {};
    tables.forEach((t: any) => {
      data[t.name] = Array.from({ length: 10 }).map((_, i) => {
        const row: any = {};
        t.columns.forEach((c: any) => {
          const name = c.name.toLowerCase();
          if (c.isPK) row[c.name] = `id_${Math.random().toString(36).substr(2, 9)}`;
          else if (name.includes('email')) row[c.name] = `user${i}@example.com`;
          else if (name.includes('name')) row[c.name] = `Entity Name ${i}`;
          else if (name.includes('price') || name.includes('amount')) row[c.name] = parseFloat((Math.random() * 100).toFixed(2));
          else if (c.type === 'Number') row[c.name] = Math.floor(Math.random() * 1000);
          else if (c.type === 'Boolean') row[c.name] = Math.random() > 0.5;
          else if (c.type === 'Date') row[c.name] = new Date(Date.now() - Math.random() * 10000000000).toISOString();
          else row[c.name] = `sample_${c.name}_${i}`;
        });
        return row;
      });
    });
    return JSON.stringify(data, null, 2);
  };

  const generateFastAPI = () => {
    return tables.map((t: any) => {
      return `# routers/${t.name.toLowerCase()}.py
from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional
from pydantic import BaseModel, Field
from datetime import datetime
# from database import get_db # Dependency injection for DB
# from auth import get_current_user # Dependency for JWT auth

router = APIRouter(prefix="/${t.name.toLowerCase()}", tags=["${t.name}"])

class ${t.name}Base(BaseModel):
${t.columns.map((c: any) => {
  const pyType = c.type === 'Number' ? 'float' : c.type === 'Boolean' ? 'bool' : c.type === 'Date' ? 'datetime' : 'str';
  return `    ${c.name}: ${c.isNotNull ? pyType : `Optional[${pyType}] = None`}`;
}).join('\n')}

class ${t.name}Create(${t.name}Base):
    pass

class ${t.name}Response(${t.name}Base):
    id: str = Field(alias="_id")

    class Config:
        populate_by_name = True

@router.get("/", response_model=dict)
async def get_all(
    skip: int = Query(0, ge=0), 
    limit: int = Query(10, ge=1, le=100)
    # current_user = Depends(get_current_user)
):
    """
    Retrieve ${t.name} with pagination.
    """
    # cursor = db.${t.name.toLowerCase()}.find().skip(skip).limit(limit)
    # data = await cursor.to_list(length=limit)
    # total = await db.${t.name.toLowerCase()}.count_documents({})
    # return {"total": total, "skip": skip, "limit": limit, "data": data}
    return {"message": "Not implemented"}

@router.get("/{id}", response_model=${t.name}Response)
async def get_by_id(id: str):
    # data = await db.${t.name.toLowerCase()}.find_one({"_id": id})
    # if not data:
    #     raise HTTPException(status_code=404, detail="Item not found")
    # return data
    raise HTTPException(status_code=501, detail="Not implemented")

@router.post("/", response_model=${t.name}Response, status_code=201)
async def create(item: ${t.name}Create):
    # new_item = item.model_dump()
    # result = await db.${t.name.toLowerCase()}.insert_one(new_item)
    # created_item = await db.${t.name.toLowerCase()}.find_one({"_id": result.inserted_id})
    # return created_item
    raise HTTPException(status_code=501, detail="Not implemented")

@router.put("/{id}", response_model=${t.name}Response)
async def update(id: str, item: ${t.name}Create):
    # update_result = await db.${t.name.toLowerCase()}.update_one({"_id": id}, {"$set": item.model_dump(exclude_unset=True)})
    # if update_result.modified_count == 0:
    #     raise HTTPException(status_code=404, detail="Item not found")
    # return await db.${t.name.toLowerCase()}.find_one({"_id": id})
    raise HTTPException(status_code=501, detail="Not implemented")

@router.delete("/{id}", status_code=204)
async def delete(id: str):
    # delete_result = await db.${t.name.toLowerCase()}.delete_one({"_id": id})
    # if delete_result.deleted_count == 0:
    #     raise HTTPException(status_code=404, detail="Item not found")
    return None
`;
    }).join("\n\n# " + "=".repeat(60) + "\n\n");
  };

  const handleDownload = async () => {
    const zip = new JSZip();
    zip.file("models.js", generateMongoose());
    zip.file("schema.prisma", generatePrisma());
    zip.file("schema.sql", generateSQL());
    zip.file("express_routes.js", generateExpress());
    zip.file("fastapi_routes.py", generateFastAPI());
    zip.file("seed_data.json", generateSeedData());
    zip.file("flowforge-schema.json", JSON.stringify({tables, relations}, null, 2));
    const content = await zip.generateAsync({type:"blob"});
    const url = URL.createObjectURL(content);
    const a = document.createElement("a");
    a.href = url;
    a.download = "flowforge-mern-api.zip";
    a.click();
  };

  const tabs = [
    { id: "mongoose", label: "Mongoose", icon: Code2 },
    { id: "prisma", label: "Prisma", icon: Code2 },
    { id: "sql", label: "SQL DDL", icon: Server },
    { id: "express", label: "Express API", icon: Server },
    { id: "fastapi", label: "FastAPI", icon: TerminalSquare },
    { id: "seed", label: "Seed Data", icon: Database },
  ];

  return (
    <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="absolute bottom-0 left-0 right-0 h-[65vh] bg-slate-900/95 backdrop-blur-xl border-t border-slate-800 z-50 flex flex-col shadow-2xl">
      <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
        <div className="flex items-center gap-6">
          <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2 mr-4">
            <Code2 className="w-5 h-5 text-emerald-400" /> API Generator
          </h2>
          <div className="flex items-center gap-2 bg-slate-800/50 p-1 rounded-xl">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? "bg-emerald-500/20 text-emerald-300 shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-700/50"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleDownload} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg transition-colors shadow-lg shadow-emerald-500/20">
            <Download className="w-4 h-4"/> Download .ZIP
          </button>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
      <div className="flex-1 p-6 overflow-auto bg-[#0d1117]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <pre className="text-[13px] font-mono text-emerald-200/90 font-medium whitespace-pre-wrap leading-relaxed">
              {activeTab === "mongoose" && generateMongoose()}
              {activeTab === "prisma" && generatePrisma()}
              {activeTab === "sql" && generateSQL()}
              {activeTab === "express" && generateExpress()}
              {activeTab === "fastapi" && generateFastAPI()}
              {activeTab === "seed" && generateSeedData()}
            </pre>
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
