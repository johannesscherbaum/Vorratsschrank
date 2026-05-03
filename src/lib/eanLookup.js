export async function lookupEAN(ean){
  try{
    const res=await fetch(`https://world.openfoodfacts.org/api/v0/product/${ean}.json`)
    if(!res.ok) return null
    const data=await res.json()
    if(data.status!==1||!data.product) return null
    const p=data.product
    return{
      name: p.product_name_de||p.product_name||'',
      category: mapCat(p.categories_tags),
      qty: parseQty(p.quantity),
      unit: parseUnit(p.quantity),
    }
  }catch{return null}
}

function mapCat(tags=[]){
  const map={'en:meats':'Fleisch & Fisch','en:fish':'Fleisch & Fisch','en:dairies':'Milchprodukte',
    'en:cheeses':'Milchprodukte','en:milks':'Milchprodukte','en:vegetables':'Gemüse',
    'en:fruits':'Obst','en:breads':'Getreide & Brot','en:cereals':'Getreide & Brot',
    'en:pastas':'Getreide & Brot','en:legumes':'Hülsenfrüchte','en:canned-foods':'Konserven',
    'en:frozen-foods':'Tiefkühlware','en:beverages':'Getränke','en:condiments':'Gewürze & Saucen',
    'en:sauces':'Gewürze & Saucen','en:baking':'Backzutaten'}
  for(const t of tags) if(map[t]) return map[t]
  return ''
}
function parseQty(q=''){const m=q.match(/[\d.,]+/); return m?parseFloat(m[0].replace(',','.')):'' }
function parseUnit(q=''){
  const l=q.toLowerCase()
  if(l.includes('kg')) return 'kg'
  if(l.includes('ml')||l.includes('cl')) return 'ml'
  if(l.includes('l')) return 'L'
  if(l.includes('g')) return 'g'
  return 'Stück'
}
