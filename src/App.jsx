import React, { useEffect, useMemo, useState } from 'react'
import { Building2, WalletCards, ArrowDownToLine, ArrowUpFromLine, Search, Trash2, Gavel, Receipt, ShieldCheck, X, Pencil } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend } from 'recharts'

const MONTHS = ['Mes 1','Mes 2','Mes 3','Mes 4','Mes 5','Mes 6']
const UNITS = [
  { id:'Departamento 1', number:'101' }, { id:'Departamento 2', number:'102' }, { id:'Departamento 3', number:'103' },
  { id:'Departamento 4', number:'201' }, { id:'Departamento 5', number:'202' }, { id:'Departamento 6', number:'203', admin:true },
  { id:'Departamento 7', number:'301' }, { id:'Departamento 8', number:'302' }, { id:'Departamento 9', number:'303' }
]
const EXPENSES = ['Basura','Limpieza del edificio','Luz','Agua','Insumos de limpieza','Mantenimiento','Reparaciones','Gasto extraordinario','Otro']
const COLORS = ['#2563eb','#10b981','#f59e0b','#8b5cf6','#ec4899','#06b6d4','#84cc16','#f97316','#64748b']
const MXN = new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN'})
const today = new Date().toISOString().slice(0,10)
const labelUnit = id => { const u=UNITS.find(x=>x.id===id); return u ? `${u.id} (${u.number})` : id }

const initial = {
  openingBalance: 0, deposits: [], payments: [], fines: []
}
function loadData(){ try { return {...initial,...JSON.parse(localStorage.getItem('portal-edificio-data'))} || initial } catch { return initial } }
function fileToDataUrl(file){ return new Promise((resolve,reject)=>{ const r=new FileReader(); r.onload=()=>resolve(r.result); r.onerror=reject; r.readAsDataURL(file) }) }

export default function App(){
  const [data,setData]=useState(loadData)
  const [tab,setTab]=useState('resumen')
  const [month,setMonth]=useState('Todos')
  const [statementUnit,setStatementUnit]=useState(UNITS[0].id)
  const [query,setQuery]=useState('')
  const [modal,setModal]=useState(null)
  const [deposit,setDeposit]=useState({date:today,month:'Mes 1',unit:UNITS[0].id,concept:'Cuota de mantenimiento',amount:''})
  const [expenseForm,setExpenseForm]=useState({date:today,month:'Mes 1',category:'Basura',provider:'',concept:'',amount:'',receipt:null,receiptName:''})
  const [fine,setFine]=useState({date:today,month:'Mes 1',unit:UNITS[0].id,reason:'',amount:'',status:'Pendiente'})
  const [openingBalance,setOpeningBalance]=useState(data.openingBalance || '')
  useEffect(()=>localStorage.setItem('portal-edificio-data',JSON.stringify(data)),[data])

  const scopedDeposits=data.deposits.filter(x=>month==='Todos'||x.month===month)
  const scopedPayments=data.payments.filter(x=>month==='Todos'||x.month===month)
  const scopedFines=data.fines.filter(x=>month==='Todos'||x.month===month)
  const income=scopedDeposits.reduce((s,x)=>s+x.amount,0)+scopedFines.filter(x=>x.status==='Pagada').reduce((s,x)=>s+x.amount,0)
  const expenses=scopedPayments.reduce((s,x)=>s+x.amount,0)
  const balance=data.openingBalance+income-expenses
  const pendingFines=data.fines.filter(x=>x.status==='Pendiente').reduce((s,x)=>s+x.amount,0)
  const chartData=MONTHS.map(m=>({month:m.replace('Mes ','M'),ingresos:data.deposits.filter(x=>x.month===m).reduce((s,x)=>s+x.amount,0)+data.fines.filter(x=>x.month===m&&x.status==='Pagada').reduce((s,x)=>s+x.amount,0),gastos:data.payments.filter(x=>x.month===m).reduce((s,x)=>s+x.amount,0)}))
  const categoryData=EXPENSES.map(name=>({name,value:scopedPayments.filter(x=>x.category===name).reduce((s,x)=>s+x.amount,0)})).filter(x=>x.value>0)
  const movements=useMemo(()=>[
    ...(data.openingBalance>0?[{id:'opening-balance',amount:data.openingBalance,date:'',month:'Todos',type:'Fondo inicial',concept:'Fondo inicial de la administración',detail:'Saldo de arranque'}]:[]),
    ...data.deposits.map(x=>({...x,type:'Depósito',detail:labelUnit(x.unit)})),
    ...data.payments.map(x=>({...x,type:x.category==='Gasto extraordinario'?'Gasto extraordinario':'Gasto',detail:x.provider})),
    ...data.fines.map(x=>({...x,type:'Multa',concept:x.reason,detail:labelUnit(x.unit)}))
  ].filter(x=>x.type==='Fondo inicial'||month==='Todos'||x.month===month).filter(x=>`${x.type} ${x.concept} ${x.detail}`.toLowerCase().includes(query.toLowerCase())).sort((a,b)=>b.id-a.id),[data,month,query])

  const saveOpeningBalance=()=>{ const amount=Number(openingBalance); if(amount<0)return; setData(d=>({...d,openingBalance:amount})); setModal(null) }
  const saveDeposit=()=>{ const amount=Number(deposit.amount); if(amount<=0)return; setData(d=>({...d,deposits:modal==='editDeposit'?d.deposits.map(x=>x.id===deposit.id?{...deposit,amount}:x):[...d.deposits,{...deposit,amount,id:Date.now()}]})); setDeposit(x=>({...x,amount:''})); setModal(null) }
  const saveExpense=()=>{ const amount=Number(expenseForm.amount); if(amount<=0||!expenseForm.concept.trim())return; setData(d=>({...d,payments:modal==='editExpense'?d.payments.map(x=>x.id===expenseForm.id?{...expenseForm,amount}:x):[...d.payments,{...expenseForm,amount,id:Date.now()}]})); setExpenseForm(x=>({...x,provider:'',concept:'',amount:'',receipt:null,receiptName:''})); setModal(null) }
  const saveFine=()=>{ const amount=Number(fine.amount); if(amount<=0||!fine.reason.trim())return; setData(d=>({...d,fines:modal==='editFine'?d.fines.map(x=>x.id===fine.id?{...fine,amount}:x):[...d.fines,{...fine,amount,id:Date.now()}]})); setFine(x=>({...x,reason:'',amount:''})); setModal(null) }
  const edit=move=>{ if(move.type==='Depósito')setDeposit(move); else if(move.type==='Multa')setFine({...move,reason:move.reason||move.concept}); else setExpenseForm(move); setModal(move.type==='Depósito'?'editDeposit':move.type==='Multa'?'editFine':'editExpense') }
  const remove=move=>setData(d=>move.type==='Depósito'?({...d,deposits:d.deposits.filter(x=>x.id!==move.id)}):move.type==='Multa'?({...d,fines:d.fines.filter(x=>x.id!==move.id)}):({...d,payments:d.payments.filter(x=>x.id!==move.id)}))
  const toggleFine=id=>setData(d=>({...d,fines:d.fines.map(x=>x.id===id?{...x,status:x.status==='Pendiente'?'Pagada':'Pendiente'}:x)}))

  const statementDeposits=data.deposits.filter(x=>x.unit===statementUnit)
  const statementFines=data.fines.filter(x=>x.unit===statementUnit)
  const statementRows=[...statementDeposits.map(x=>({...x,type:'Cuota',concept:x.concept,status:'Pagada'})),...statementFines.map(x=>({...x,type:'Multa',concept:x.reason}))].sort((a,b)=>b.id-a.id)

  return <div className="app">
    <header><div className="brand"><span className="brandIcon"><Building2/></span><div><h1>Administración de Pirineos 184</h1><p>9 departamentos · Periodo de 6 meses</p></div></div><div className="actions">
      <select value={month} onChange={e=>setMonth(e.target.value)}><option>Todos</option>{MONTHS.map(m=><option key={m}>{m}</option>)}</select>
      <button onClick={()=>setModal('opening')}><WalletCards/>Fondo inicial</button>
      <button className="success" onClick={()=>setModal('deposit')}><ArrowDownToLine/>Depósito</button>
      <button onClick={()=>setModal('expense')}><ArrowUpFromLine/>Gasto</button>
      <button className="purple" onClick={()=>setModal('fine')}><Gavel/>Multa</button>
    </div></header>
    <main>
      <section className="metrics">
        <Metric icon={<ArrowDownToLine/>} label="Ingresos cobrados" value={MXN.format(income)} sub="Cuotas y multas pagadas" color="green"/>
        <Metric icon={<ArrowUpFromLine/>} label="Gastos" value={MXN.format(expenses)} sub={`${scopedPayments.length} registros`} color="orange"/>
        <Metric icon={<WalletCards/>} label="Saldo" value={MXN.format(balance)} sub={balance>=0?'Balance a favor':'Balance negativo'} color="blue"/>
        <Metric icon={<Gavel/>} label="Multas pendientes" value={MXN.format(pendingFines)} sub="Por cobrar" color="purple"/>
      </section>
      <nav>{[['resumen','Resumen'],['departamentos','Departamentos'],['multas','Multas'],['estado','Estado de cuenta'],['movimientos','Movimientos']].map(([id,name])=><button key={id} className={tab===id?'active':''} onClick={()=>setTab(id)}>{name}</button>)}</nav>

      {tab==='resumen'&&<section className="grid2">
        <Card title="Flujo por mes"><div className="chart"><ResponsiveContainer><BarChart data={chartData}><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="month"/><YAxis/><Tooltip formatter={v=>MXN.format(v)}/><Bar dataKey="ingresos" fill="#10b981" radius={[6,6,0,0]}/><Bar dataKey="gastos" fill="#2563eb" radius={[6,6,0,0]}/></BarChart></ResponsiveContainer></div></Card>
        <Card title="Distribución de gastos">{categoryData.length?<div className="chart"><ResponsiveContainer><PieChart><Pie data={categoryData} dataKey="value" nameKey="name" outerRadius={90}>{categoryData.map((x,i)=><Cell key={x.name} fill={COLORS[i%COLORS.length]}/>)}</Pie><Tooltip formatter={v=>MXN.format(v)}/><Legend/></PieChart></ResponsiveContainer></div>:<Empty text="No hay gastos para este periodo."/>}</Card>
      </section>}

      {tab==='departamentos'&&<section className="floors">{[[3,['Departamento 7','Departamento 8','Departamento 9']],[2,['Departamento 4','Departamento 5','Departamento 6']],[1,['Departamento 1','Departamento 2','Departamento 3']]].map(([floor,ids])=><div className="floor" key={floor}><h3>Piso {floor}</h3><div className="units">{ids.map(id=>{const u=UNITS.find(x=>x.id===id);const deps=data.deposits.filter(x=>x.unit===id);const covered=new Set(deps.map(x=>x.month)).size;return <article className={`unit ${u.admin?'admin':''}`} key={id}><div><h4>{id} ({u.number})</h4>{u.admin&&<span className="adminBadge"><ShieldCheck/>Administrador</span>}<p>Aportado: {MXN.format(deps.reduce((s,x)=>s+x.amount,0))}</p></div><div className="progress"><span style={{width:`${covered/6*100}%`}}/></div><small>{covered} de 6 meses cubiertos</small></article>})}</div></div>)}</section>}

      {tab==='multas'&&<Card title="Control de multas">{data.fines.length?data.fines.map(x=><div className="row" key={x.id}><div><b>{labelUnit(x.unit)}</b><p>{x.reason}</p><small>{x.date} · {x.month}</small></div><div className="rowActions"><strong>{MXN.format(x.amount)}</strong><span className={`status ${x.status==='Pagada'?'paid':''}`}>{x.status}</span><button onClick={()=>toggleFine(x.id)}>{x.status==='Pendiente'?'Marcar pagada':'Marcar pendiente'}</button><button className="iconBtn" onClick={()=>edit({...x,type:'Multa'})}><Pencil/></button><button className="iconBtn" onClick={()=>remove({...x,type:'Multa'})}><Trash2/></button></div></div>):<Empty text="Aún no hay multas registradas."/>}</Card>}

      {tab==='estado'&&<Card title="Estado de cuenta por departamento" action={<select value={statementUnit} onChange={e=>setStatementUnit(e.target.value)}>{UNITS.map(u=><option key={u.id} value={u.id}>{u.id} ({u.number})</option>)}</select>}><div className="summary"><Summary label="Total pagado" value={MXN.format(statementDeposits.reduce((s,x)=>s+x.amount,0)+statementFines.filter(x=>x.status==='Pagada').reduce((s,x)=>s+x.amount,0))}/><Summary label="Multas pendientes" value={MXN.format(statementFines.filter(x=>x.status==='Pendiente').reduce((s,x)=>s+x.amount,0))}/><Summary label="Meses cubiertos" value={`${new Set(statementDeposits.map(x=>x.month)).size} de 6`}/></div>{statementRows.length?statementRows.map(x=><div className="row" key={`${x.type}-${x.id}`}><span>{x.date}</span><b>{x.type}</b><span>{x.concept}</span><strong>{MXN.format(x.amount)} · {x.status}</strong></div>):<Empty text="No hay movimientos para este departamento."/>}</Card>}

      {tab==='movimientos'&&<Card title="Historial financiero" action={<div className="search"><Search/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar..."/>{query&&<button onClick={()=>setQuery('')}><X/></button>}</div>}>{movements.length?movements.map(x=><div className="row" key={`${x.type}-${x.id}`}><span>{x.date}</span><div><b>{x.type}</b><p>{x.concept}</p><small>{x.detail}</small>{x.receipt&&<a className="receipt" href={x.receipt} target="_blank" rel="noreferrer"><img src={x.receipt} alt="Comprobante"/><Receipt/>Ver comprobante</a>}</div><strong>{MXN.format(x.amount)}</strong>{x.type!=='Fondo inicial'&&<><button className="iconBtn" onClick={()=>edit(x)}><Pencil/></button><button className="iconBtn" onClick={()=>remove(x)}><Trash2/></button></>}</div>):<Empty text="No hay movimientos."/>}</Card>}
    </main>

    {modal&&<div className="overlay" onMouseDown={()=>setModal(null)}><div className="modal" onMouseDown={e=>e.stopPropagation()}><button className="close" onClick={()=>setModal(null)}><X/></button>
      {modal==='deposit'&&<Form title="Registrar depósito" action={saveDeposit}><DateMonth form={deposit} setForm={setDeposit}/><Field label="Departamento"><UnitSelect value={deposit.unit} onChange={v=>setDeposit({...deposit,unit:v})}/></Field><Field label="Concepto"><input value={deposit.concept} onChange={e=>setDeposit({...deposit,concept:e.target.value})}/></Field><Field label="Monto"><input type="number" value={deposit.amount} onChange={e=>setDeposit({...deposit,amount:e.target.value})}/></Field></Form>}
      {modal==='expense'&&<Form title="Registrar gasto" action={saveExpense}><DateMonth form={expenseForm} setForm={setExpenseForm}/><Field label="Categoría"><select value={expenseForm.category} onChange={e=>setExpenseForm({...expenseForm,category:e.target.value})}>{EXPENSES.map(x=><option key={x}>{x}</option>)}</select></Field><Field label="Proveedor o persona"><input value={expenseForm.provider} onChange={e=>setExpenseForm({...expenseForm,provider:e.target.value})}/></Field><Field label="Concepto"><input value={expenseForm.concept} onChange={e=>setExpenseForm({...expenseForm,concept:e.target.value})}/></Field><Field label="Monto"><input type="number" value={expenseForm.amount} onChange={e=>setExpenseForm({...expenseForm,amount:e.target.value})}/></Field><Field label="Ticket o comprobante"><input type="file" accept="image/png,image/jpeg,image/webp" onChange={async e=>{const f=e.target.files?.[0];if(f)setExpenseForm({...expenseForm,receipt:await fileToDataUrl(f),receiptName:f.name})}}/>{expenseForm.receipt&&<img className="preview" src={expenseForm.receipt} alt="Vista previa"/>}</Field></Form>}
      {modal==='fine'&&<Form title="Registrar multa" action={saveFine}><DateMonth form={fine} setForm={setFine}/><Field label="Departamento"><UnitSelect value={fine.unit} onChange={v=>setFine({...fine,unit:v})}/></Field><Field label="Motivo"><input value={fine.reason} onChange={e=>setFine({...fine,reason:e.target.value})}/></Field><Field label="Monto"><input type="number" value={fine.amount} onChange={e=>setFine({...fine,amount:e.target.value})}/></Field></Form>}
      {modal==='opening'&&<Form title="Configurar fondo inicial" action={saveOpeningBalance}><Field label="Monto disponible al iniciar"><input type="number" min="0" value={openingBalance} onChange={e=>setOpeningBalance(e.target.value)}/></Field></Form>}
      {modal==='editDeposit'&&<Form title="Editar depósito" action={saveDeposit}><DateMonth form={deposit} setForm={setDeposit}/><Field label="Departamento"><UnitSelect value={deposit.unit} onChange={v=>setDeposit({...deposit,unit:v})}/></Field><Field label="Concepto"><input value={deposit.concept} onChange={e=>setDeposit({...deposit,concept:e.target.value})}/></Field><Field label="Monto"><input type="number" value={deposit.amount} onChange={e=>setDeposit({...deposit,amount:e.target.value})}/></Field></Form>}
      {modal==='editExpense'&&<Form title="Editar gasto" action={saveExpense}><DateMonth form={expenseForm} setForm={setExpenseForm}/><Field label="Categoría"><select value={expenseForm.category} onChange={e=>setExpenseForm({...expenseForm,category:e.target.value})}>{EXPENSES.map(x=><option key={x}>{x}</option>)}</select></Field><Field label="Proveedor o persona"><input value={expenseForm.provider} onChange={e=>setExpenseForm({...expenseForm,provider:e.target.value})}/></Field><Field label="Concepto"><input value={expenseForm.concept} onChange={e=>setExpenseForm({...expenseForm,concept:e.target.value})}/></Field><Field label="Monto"><input type="number" value={expenseForm.amount} onChange={e=>setExpenseForm({...expenseForm,amount:e.target.value})}/></Field><Field label="Ticket o comprobante"><input type="file" accept="image/png,image/jpeg,image/webp" onChange={async e=>{const f=e.target.files?.[0];if(f)setExpenseForm({...expenseForm,receipt:await fileToDataUrl(f),receiptName:f.name})}}/>{expenseForm.receipt&&<img className="preview" src={expenseForm.receipt} alt="Vista previa"/>}</Field></Form>}
      {modal==='editFine'&&<Form title="Editar multa" action={saveFine}><DateMonth form={fine} setForm={setFine}/><Field label="Departamento"><UnitSelect value={fine.unit} onChange={v=>setFine({...fine,unit:v})}/></Field><Field label="Motivo"><input value={fine.reason} onChange={e=>setFine({...fine,reason:e.target.value})}/></Field><Field label="Monto"><input type="number" value={fine.amount} onChange={e=>setFine({...fine,amount:e.target.value})}/></Field></Form>}
    </div></div>}
  </div>
}

function Metric({icon,label,value,sub,color}){return <article className={`metric ${color}`}><span>{icon}</span><div><small>{label}</small><h2>{value}</h2><p>{sub}</p></div></article>}
function Card({title,action,children}){return <section className="card"><div className="cardHead"><h2>{title}</h2>{action}</div>{children}</section>}
function Empty({text}){return <div className="empty">{text}</div>}
function Summary({label,value}){return <div><small>{label}</small><b>{value}</b></div>}
function Field({label,children}){return <label className="field"><span>{label}</span>{children}</label>}
function UnitSelect({value,onChange}){return <select value={value} onChange={e=>onChange(e.target.value)}>{UNITS.map(u=><option value={u.id} key={u.id}>{u.id} ({u.number}){u.admin?' · Administrador':''}</option>)}</select>}
function DateMonth({form,setForm}){return <div className="pair"><Field label="Fecha"><input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/></Field><Field label="Mes"><select value={form.month} onChange={e=>setForm({...form,month:e.target.value})}>{MONTHS.map(m=><option key={m}>{m}</option>)}</select></Field></div>}
function Form({title,action,children}){return <><h2>{title}</h2><div className="form">{children}<button className="primary" onClick={action}>Guardar</button></div></>}
