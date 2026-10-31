"""Delade regler för designskripten (tackning.py, zoner). Läser bara designfilerna."""
import sys; sys.dont_write_bytecode = True
import json,os
def L(d,f): return json.load(open(os.path.join(d,f)))
def ringar(w): return {r['ring']:tuple(r['nivaband']) for r in w['meta']['zonmodell']['ringar'] if r['ring']>=1}
def biompool(v):
    """familj -> undertyper, som spawnRules.ts: union av egna_monster och monsterfamiljer."""
    fam={}
    for g in v['egna_monster']:
        for u in g['undertyper_nu']: fam.setdefault(g['familj'],[]).append(u)
    for f,l in v.get('monsterfamiljer',{}).items(): fam.setdefault(f,[]).extend(l)
    return {f:list(dict.fromkeys(l)) for f,l in fam.items()}
def vikter(v,gen):
    vk=dict(gen['monsterpooler'].get('vikter',{}).get('undertyper',{}))
    for g in v['egna_monster']: vk.update(g.get('vikter',{}))
    return vk
def cell(v,M,fl,band):
    out={}
    for f,us in biompool(v).items():
        h=[u for u in us if u in M and M[u]['family']==f and not M[u]['boss'] and not M[u].get('underboss') and band[0]<=fl.get(u,-1)<=band[1]]
        if h: out[f]=sorted(h,key=lambda u:fl[u])
    return out
def zoner(d):
    """Generera zones per monster: spawnzoner-områden, regioner (undertyper/boss) och mellanmark_<biom>."""
    w=L(d,'varld_stor.json'); s=L(d,'spawnzoner.json'); M={x['id']:x for x in L(d,'monsterfamiljer.json')['monsters']}
    fl=L(d,'monster_niva.json')['fixed_levels']; Z={k:[] for k in M}
    def add(u,z):
        if u in Z and z not in Z[u]: Z[u].append(z)
    def strs(o):
        if isinstance(o,dict):
            for v in o.values(): yield from strs(v)
        elif isinstance(o,list):
            for v in o: yield from strs(v)
        elif isinstance(o,str): yield o
    for a in s['areas']:
        for t in strs(a): add(t,a['id'])  # enemy_table, spawn_points, zone_tables, boss och family_mix
    for r in w['regioner']:
        for u in r.get('undertyper') or []: add(u,r['id'])
        if r.get('boss'): add(r['boss'],r['id'])
    R=ringar(w)
    for b,v in w['biomer'].items():
        for band in R.values():
            for f,us in cell(v,M,fl,band).items():
                for u in us: add(u,'mellanmark_'+b)
    return Z

def grannfel(d):
    """Kontrollera varld_stor.json grannar: dubbelriktade, och varje par delar chunkkant eller ligger i följd på en väg.
    Delområdenas chunkar (bana1_stor.json) räknas till sin region. Banor räknas inte som kantgrannar."""
    import math
    w=L(d,'varld_stor.json'); b=L(d,'bana1_stor.json'); R={r['id']:r for r in w['regioner']}; fel=[]
    dl={tuple(x['chunk']):x['region'] for x in b['delomraden']}
    def owner(c):
        if c in dl: return dl[c]
        k=[(math.hypot(c[0]-r['chunk'][0],c[1]-r['chunk'][1]),r['id']) for r in R.values() if max(abs(c[0]-r['chunk'][0]),abs(c[1]-r['chunk'][1]))<=r['radie']]
        return min(k)[1] if k else None
    O={(x,y):owner((x,y)) for x in range(-30,31) for y in range(-30,31)}
    kant=set()
    for (x,y),o in O.items():
        for p in (O.get((x+1,y)),O.get((x,y+1))):
            if o and p and p!=o and R[o].get('typ')!='bana' and R[p].get('typ')!='bana': kant.add(frozenset((o,p)))
    vag=set()
    for v in w['vagar']:
        s=v['strackning']; vag|={frozenset(p) for p in zip(s,s[1:])}
    for r in R.values():
        for g in r.get('grannar',[]):
            if g not in R: fel.append(f'grannar: {r["id"]} pekar på okänd {g}')
            elif r['id'] not in R[g].get('grannar',[]): fel.append(f'grannar: {r["id"]} till {g} är inte dubbelriktad')
            elif frozenset((r['id'],g)) not in kant|vag: fel.append(f'grannar: {r["id"]} och {g} delar varken kant eller väg')
    for p in kant:
        a,c=sorted(p)
        if c not in R[a].get('grannar',[]): fel.append(f'grannar: {a} och {c} delar kant men är inte grannar')
    for p in vag:
        a,c=sorted(p)
        if c not in R[a].get('grannar',[]): fel.append(f'grannar: {a} och {c} ligger i följd på en väg men är inte grannar')
    D={x['id']:x for x in b['delomraden']}
    for x in D.values():
        for g in x.get('grannar',[]):
            if g in R and g not in D: continue  # granne utanför bana 1 är en region i varld_stor.json
            if g not in D or x['id'] not in D[g].get('grannar',[]): fel.append(f'bana1 grannar: {x["id"]} till {g}')
    return sorted(set(fel))
