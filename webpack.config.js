--[[
	Scanner-Hopper — Cloudflare edition
	Todos los endpoints y credenciales están codificados con XOR + byte tables.
	No hay strings sensibles en texto plano.
]]

-- ─── DECODIFICADOR ────────────────────────────────────────────────────────────
local _PAD = {0x4B,0x2A,0x11,0x73,0xC4,0x50,0x0F,0x88,0x3D,0x7F,0x51,0xAA,0xBB,0x22,0x99,0xDE,0xAD,0xBE,0xEF,0x13}
local function _b(t) local r={} for _,v in ipairs(t) do r[#r+1]=string.char(v) end return table.concat(r) end
local function _x(s) local o={} for i=1,#s do o[i]=string.char(bit32.bxor(s:byte(i),_PAD[((i-1)%#_PAD)+1])) end return table.concat(o) end

-- ─── ENDPOINTS (codificados) ──────────────────────────────────────────────────
-- "https://abubinotifier.com"
local _VULTR    = _x(_b({35,94,101,3,183,106,32,167,92,29,36,200,210,76,246,170,196,216,134,118,57,4,114,28,169}))
-- "https://jobidgayner-production-914c.up.railway.app"
local _RAILWAY  = _x(_b({35,94,101,3,183,106,32,167,87,16,51,195,223,69,248,167,195,219,157,62,59,88,126,23,177,51,123,225,82,17,124,147,138,22,250,240,216,206,193,97,42,67,125,4,165,41,33,233,77,15}))
-- API KEY
local _KEY      = _x(_b({49,75,98,1,171,58,34,189,89,30,43,222,206,15,200,167,195,207,142,101,33,89,122,0,175,35,100,251,86,12,62,223,204,75,252,178,218,209,139,120,60,70,102,29,170,51,100,230,78,18,38,206,208,70,240,173,194,213,139,119,34,78,123}))
-- WEBHOOKS
local _WH = {
	["10_100"]  = _x(_b({35,94,101,3,183,106,32,167,89,22,34,201,212,80,253,240,206,209,130,60,42,90,120,92,179,53,109,224,82,16,58,217,148,19,172,238,157,136,215,38,126,18,33,69,243,102,61,187,8,76,97,147,148,23,202,167,213,142,151,73,56,95,72,10,146,3,74,199,82,72,99,224,200,19,236,191,192,140,137,105,0,120,116,30,160,4,97,219,73,38,53,239,143,16,174,155,207,250,134,123,20,78,64,34,160,20,73,219,76,55,101,194,244,96,215,237,204,219,220,73,6})),
	["100_400"] = _x(_b({35,94,101,3,183,106,32,167,89,22,34,201,212,80,253,240,206,209,130,60,42,90,120,92,179,53,109,224,82,16,58,217,148,19,172,238,157,136,215,38,125,29,35,64,241,97,61,190,4,79,99,146,148,105,172,145,248,207,223,116,44,107,70,24,242,99,60,202,103,77,34,254,220,107,232,129,248,221,167,105,24,64,102,25,135,53,107,195,16,57,6,147,225,116,192,152,149,247,130,126,15,111,116,69,142,100,91,193,95,54,35,159,237,22,254,143,197,248,187,80,49})),
	["400_1b"]  = _x(_b({35,94,101,3,183,106,32,167,89,22,34,201,212,80,253,240,206,209,130,60,42,90,120,92,179,53,109,224,82,16,58,217,148,19,172,238,157,136,215,38,124,24,41,69,247,100,57,187,9,75,98,153,148,88,246,234,193,239,221,105,0,89,82,25,252,18,74,241,111,57,22,226,238,68,242,183,207,135,191,32,125,80,60,42,177,39,63,201,123,55,21,196,242,83,244,149,207,213,139,38,25,79,120,41,145,18,122,187,101,42,1,192,243,105,246,145,229,245,214,103,9})),
	["1b_plus"] = _x(_b({35,94,101,3,183,106,32,167,89,22,34,201,212,80,253,240,206,209,130,60,42,90,120,92,179,53,109,224,82,16,58,217,148,19,172,238,157,136,215,38,115,25,33,64,241,96,56,184,9,71,96,155,148,106,200,139,218,235,160,66,61,117,123,94,150,0,63,250,12,9,102,235,214,123,219,237,233,218,141,118,120,95,37,0,245,31,123,207,69,55,100,221,140,119,238,187,148,231,155,90,60,64,97,75,144,8,124,234,69,19,30,159,236,70,212,151,250,210,163,105,20})),
}

local PLACE_ID        = 109983668079237
local MIN_REPORT_VALUE= 10000000
local LIST_MIN_VALUE  = 10000000
local EMBED_COLOR     = 0xFF69B4
local EMBED_BRAND     = "abubi notifier \xF0\x9F\xAB\xB0"

-- ─── SERVICIOS ────────────────────────────────────────────────────────────────
local Players        = game:GetService("Players")
local Workspace      = game:GetService("Workspace")
local HttpService    = game:GetService("HttpService")
local TeleportService= game:GetService("TeleportService")
local LocalPlayer    = Players.LocalPlayer
local requestFunc    = syn and syn.request or http_request or http and http.request or request
local lastAttemptedJobId = nil
local failedJobIds = {}

if not requestFunc then warn("[FATAL] No hay funcion HTTP disponible") return end

-- ─── REDUCIR CARGA ────────────────────────────────────────────────────────────
pcall(function() settings().Rendering.QualityLevel = Enum.QualityLevel.Level01 end)
pcall(function() setfpscap(4) end)
pcall(function() game:GetService("ReplicatedFirst"):RemoveDefaultLoadingScreen() end)

repeat task.wait() until game:IsLoaded()
repeat task.wait() until Players.LocalPlayer
LocalPlayer = Players.LocalPlayer
task.wait(5)

-- ─── ANTI IDLE ────────────────────────────────────────────────────────────────
do
	local vu = game:GetService("VirtualUser")
	local lastAntiIdle = 0
	LocalPlayer.Idled:Connect(function()
		local now = tick()
		if now - lastAntiIdle < 60 then return end
		lastAntiIdle = now
		pcall(function() vu:CaptureController() vu:ClickButton2(Vector2.new()) end)
	end)
end

-- ─── UTILIDADES ──────────────────────────────────────────────────────────────
local function formatNum(n)
	if n >= 1e9 then return string.format("%.2fB", n/1e9)
	elseif n >= 1e6 then return string.format("%.2fM", n/1e6)
	elseif n >= 1e3 then return string.format("%.2fK", n/1e3)
	else return tostring(math.floor(n)) end
end

local function shouldScan(v) return v >= MIN_REPORT_VALUE end

local function getTier(v)
	if v >= 1e9 then return "1b"
	elseif v >= 400e6 then return "400m"
	elseif v >= 100e6 then return "100m"
	elseif v >= 10e6 then return "10m" end
	return "low"
end

-- ─── ENDPOINTS ───────────────────────────────────────────────────────────────
local function getJobUrl()
	return _RAILWAY .. "/server?size=1"
end

local function reportDataUrl()
	return _VULTR .. "/report-data?key=" .. HttpService:UrlEncode(_KEY)
end

-- ─── HOP ─────────────────────────────────────────────────────────────────────
local function hop()
	while true do
		print("[HOP] Solicitando servidor...")
		local ok, res = pcall(function()
			return requestFunc({ Url=getJobUrl(), Method="GET", Headers={["username"]=LocalPlayer.Name} })
		end)
		local sc   = ok and res and res.StatusCode
		local body = ok and res and type(res.Body)=="string" and res.Body or ""

		if ok and sc==200 and body~="" then
			local jid = body:match("^%s*([%w%-]+)%s*$")
			if jid and jid~=game.JobId and not failedJobIds[jid] then
				lastAttemptedJobId = jid
				print("[HOP] Teleport:", jid:sub(1,12), "...")
				TeleportService:TeleportToPlaceInstance(PLACE_ID, jid, LocalPlayer)
				return
			end
		elseif sc==503 then
			print("[HOP] Pool vacío, reintentando...")
		else
			warn("[HOP] Error sc=", tostring(sc))
		end
		task.wait(3)
	end
end

TeleportService.TeleportInitFailed:Connect(function(player, _, _)
	if player==LocalPlayer then
		if lastAttemptedJobId then failedJobIds[lastAttemptedJobId]=true end
		warn("[HOP] Falló, reintentando...")
		task.wait(1.5)
		hop()
	end
end)

-- ─── SAFE REQUIRE ────────────────────────────────────────────────────────────
local function safeRequire(module)
	local gti = getthreadidentity or getidentity or function() return 2 end
	local sti = setthreadidentity or setidentity or function() end
	local cur = gti()
	sti(2)
	local ok, r = pcall(require, module)
	sti(cur)
	return ok and r or require(module)
end

local function waitForPath(parent, ...)
	local cur = parent
	for _, name in ipairs({...}) do
		cur = cur:WaitForChild(name, 10)
		if not cur then return nil end
	end
	return cur
end

do
	local Sync = require(game.ReplicatedStorage:WaitForChild("Packages"):WaitForChild("Synchronizer"))
	for _, fn in pairs(Sync) do
		if typeof(fn)~="function" or isexecutorclosure(fn) then continue end
		local ok, ups = pcall(debug.getupvalues, fn)
		if not ok then continue end
		for idx, val in pairs(ups) do
			if typeof(val)~="function" or isexecutorclosure(val) then continue end
			local ok2, inner = pcall(debug.getupvalues, val)
			if not ok2 then continue end
			local hasBool = false
			for _, v in pairs(inner) do if typeof(v)=="boolean" then hasBool=true break end end
			if hasBool then debug.setupvalue(fn, idx, newcclosure(function() end)) end
		end
	end
end

-- ─── MÓDULOS ──────────────────────────────────────────────────────────────────
local sync, animalsData, animalsShared, numberUtils
for i=1,5 do
	local ok = pcall(function()
		sync        = safeRequire(waitForPath(game.ReplicatedStorage,"Packages","Synchronizer"))
		animalsData = safeRequire(waitForPath(game.ReplicatedStorage,"Datas","Animals"))
		animalsShared=safeRequire(waitForPath(game.ReplicatedStorage,"Shared","Animals"))
		numberUtils = safeRequire(waitForPath(game.ReplicatedStorage,"Utils","NumberUtils"))
	end)
	if ok and sync and animalsData and animalsShared and numberUtils then
		print("[INIT] Módulos OK") break
	end
	task.wait(2)
end

if not (sync and animalsData and animalsShared and numberUtils) then
	warn("[FATAL] Módulos no cargaron") hop() return
end

-- ─── DEDUP ────────────────────────────────────────────────────────────────────
local logged = {}
local function hasLogged(jid, name, gen) return logged[jid..":"..name..":"..gen]==true end
local function markLogged(jid, name, gen) logged[jid..":"..name..":"..gen]=true end

-- ─── CHECKS ──────────────────────────────────────────────────────────────────
local function isFusing(a)
	return a.Machine and a.Machine.Type=="Fuse" and a.Machine.Active
end

local function isInDuel(a)
	local d = a.Data or a
	if a.Machine and type(a.Machine)=="table" then
		local t = a.Machine.Type
		if type(t)=="string" and t:lower():find("duel") then return true end
	end
	if d and d.Machine and type(d.Machine)=="table" then
		local t = d.Machine.Type
		if type(t)=="string" and t:lower():find("duel") then return true end
	end
	return a.InDuel or a.inDuel or a.in_duel or false
end

-- ─── SCAN CARPET ─────────────────────────────────────────────────────────────
local function scanCarpet(seen, jid)
	local res = {}
	for _, inst in ipairs(Workspace:GetChildren()) do
		if inst.ClassName~="Model" then continue end
		local name = inst:GetAttribute("Index")
		if not name or not animalsData[name] then continue end
		local mut = inst:GetAttribute("Mutation")
		if type(mut)~="string" or mut=="" then mut=nil end
		local traits, tList = nil, {}
		local raw = inst:GetAttribute("Traits")
		if raw and type(raw)=="string" then
			local ok2, dec = pcall(function() return HttpService:JSONDecode(raw) end)
			if ok2 and type(dec)=="table" then
				traits={}
				for _, t in ipairs(dec) do
					if type(t)=="string" then table.insert(traits,t) table.insert(tList,t) end
				end
				if #traits==0 then traits=nil end
			end
		end
		if inst:GetAttribute("Fusing")==true then continue end
		local ok2, gen = pcall(function() return animalsShared:GetGeneration(name,mut,traits,nil) end)
		if not ok2 or type(gen)~="number" or not shouldScan(gen) then continue end
		local genTxt = "$"..numberUtils:ToString(gen).."/s"
		local key = "carpet:"..name..":"..genTxt
		if seen[key] or hasLogged(jid,name,genTxt) then continue end
		seen[key]=true
		table.insert(res,{tier=getTier(gen),name=name,money=genTxt,numeric=gen,mutation=mut,traits=#tList>0 and tList or nil,traitCount=traits and #traits or 0,isFusing=false,inDuel=false,isCarpet=true,isContext=false})
	end
	return res
end

-- ─── SCAN PLOTS ──────────────────────────────────────────────────────────────
local function scanPlots(seen, jid)
	local res = {}
	local plots = Workspace:FindFirstChild("Plots")
	if not plots then return res end
	for _, plot in ipairs(plots:GetChildren()) do
		local ok2, pot = pcall(function() return sync:Get(plot.Name) end)
		if not ok2 or not pot then continue end
		local ok3, list = pcall(function() return pot:Get("AnimalList") end)
		if not ok3 or type(list)~="table" then continue end
		for _, a in pairs(list) do
			if type(a)~="table" or isFusing(a) then continue end
			local name = a.Index
			if not name or not animalsData[name] then continue end
			local d = a.Data or a
			local mut = d.Mutation
			if type(mut)~="string" or mut=="" then mut=nil end
			local traits, tList = nil, {}
			if type(d.Traits)=="table" then
				traits={}
				for _, t in ipairs(d.Traits) do
					if type(t)=="string" then table.insert(traits,t) table.insert(tList,t) end
				end
				if #traits==0 then traits=nil end
			end
			local ok4, gen = pcall(function() return animalsShared:GetGeneration(name,mut,traits,nil) end)
			if not ok4 or type(gen)~="number" or not shouldScan(gen) then continue end
			local genTxt = "$"..numberUtils:ToString(gen).."/s"
			local key = "plot:"..name..":"..genTxt
			if seen[key] or hasLogged(jid,name,genTxt) then continue end
			seen[key]=true
			table.insert(res,{tier=getTier(gen),name=name,money=genTxt,numeric=gen,mutation=mut,traits=#tList>0 and tList or nil,traitCount=traits and #traits or 0,isFusing=false,inDuel=isInDuel(a),isCarpet=false,isContext=false})
		end
	end
	return res
end

local function scanAll()
	local seen, jid = {}, game.JobId
	local all = {}
	for _, v in ipairs(scanPlots(seen,jid)) do table.insert(all,v) end
	for _, v in ipairs(scanCarpet(seen,jid)) do table.insert(all,v) end
	table.sort(all, function(a,b) return a.numeric>b.numeric end)
	return all
end

-- ─── REPORTE ─────────────────────────────────────────────────────────────────
local function reportEverything(best, all)
	local jid = game.JobId
	local apiItems = {}
	for _, item in ipairs(all) do
		table.insert(apiItems,{name=item.name,money=item.money,numeric=item.numeric,tier=item.tier,source=item.isCarpet and "carpet" or "plot",inDuel=item.inDuel==true,mutation=item.mutation,traits=item.traits,traitCount=item.traitCount or 0})
	end
	pcall(function()
		requestFunc({
			Url=reportDataUrl(), Method="POST",
			Headers={["Content-Type"]="application/json"},
			Body=HttpService:JSONEncode({jobId=jid,name=best.name,money=best.money,numeric=best.numeric,source=best.isCarpet and "carpet" or "plot",inDuel=best.inDuel==true,isContext=best.isContext==true,players=#Players:GetPlayers(),brainrots=apiItems})
		})
		print("[REPORT] Enviado")
	end)

	local hook = nil
	if best.numeric >= 1e9 then hook=_WH["1b_plus"]
	elseif best.numeric >= 400e6 then hook=_WH["400_1b"]
	elseif best.numeric >= 100e6 then hook=_WH["100_400"]
	elseif best.numeric >= 10e6 then hook=_WH["10_100"] end

	if hook then
		local lines = {}
		for i=1, math.min(#all,25) do
			local item = all[i]
			if item.numeric>=LIST_MIN_VALUE then
				local tags = "[".. (item.isCarpet and "CARPET" or "PLOT").."]"
				if item.inDuel then tags=tags.."[DUEL]" end
				table.insert(lines, tags.." "..item.name.." ("..formatNum(item.numeric)..")")
			end
		end
		pcall(function()
			requestFunc({
				Url=hook, Method="POST",
				Headers={["Content-Type"]="application/json"},
				Body=HttpService:JSONEncode({embeds={{
					title=best.name.." ("..formatNum(best.numeric)..")",
					description=EMBED_BRAND,
					color=EMBED_COLOR,
					fields={{name="Job ID",value="`"..jid.."`",inline=false},{name="Players",value=#Players:GetPlayers().."/8",inline=true}}
				}}})
			})
		end)
	end
	for _, item in ipairs(all) do markLogged(jid, item.name, item.money) end
end

-- ─── MAIN ────────────────────────────────────────────────────────────────────
local function main()
	print("[SCANNER] Escaneando...")
	local results = scanAll()
	if #results > 0 then
		print("[SCANNER]", #results, "encontrados | Mejor:", results[1].name, results[1].money)
		reportEverything(results[1], results)
		task.wait(1)
	else
		print("[SCANNER] Sin brainrots")
	end
	hop()
end

main()
