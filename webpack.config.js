--[[
	🦖 GODZILLA NOTIFIER — Scanner-Hopper [UNDETECTED v7.1]
	 - Bypass Synchronizer intégré
	 - Sans hook IsLoaded (détecté)
	 - Sans destruction Character (détecté)
]]

-- ─── OBFUSCATION XOR (évite la détection de signatures) ───────────────────────
local _PAD = {0x4B,0x2A,0x11,0x73,0xC4,0x50,0x0F,0x88,0x3D,0x7F,0x51,0xAA,0xBB,0x22,0x99,0xDE,0xAD,0xBE,0xEF,0x13}
local function _b(t) local r={} for _,v in ipairs(t) do r[#r+1]=string.char(v) end return table.concat(r) end
local function _x(s) local o={} for i=1,#s do o[i]=string.char(bit32.bxor(s:byte(i),_PAD[((i-1)%#_PAD)+1])) end return table.concat(o) end

-- Endpoints encodés
local _VULTR    = _x(_b({35,94,101,3,183,106,32,167,92,29,36,200,210,76,246,170,196,216,134,118,57,4,114,28,169}))
local _RAILWAY  = _x(_b({35,94,101,3,183,106,32,167,92,29,36,200,210,76,246,170,196,216,134,118,57,4,114,28,169}))
local _KEY      = _x(_b({83,65,76,65,72,50,48,50,54}))

local _WH = {
	["10_100"]  = "",
	["100_400"] = "",
	["400_1b"]  = "",
	["1b_plus"] = "",
}

local PLACE_ID         = 109983668079237
local MIN_REPORT_VALUE = 100000
local LIST_MIN_VALUE   = 100000
local EMBED_COLOR      = 0x00FF00
local EMBED_BRAND      = "Godzilla Notifier 🦖"

-- ─── SERVICES ─────────────────────────────────────────────────────────────────
local Players         = game:GetService("Players")
local Workspace       = game:GetService("Workspace")
local HttpService     = game:GetService("HttpService")
local TeleportService = game:GetService("TeleportService")
local LocalPlayer     = Players.LocalPlayer
local requestFunc     = syn and syn.request or http_request or http and http.request or request

if not requestFunc then warn("[FATAL] No HTTP function") return end

-- ─── ATTENTE NORMALE (pas de bypass IsLoaded) ───────────────────────────────
repeat task.wait() until game:IsLoaded()
repeat task.wait() until Players.LocalPlayer
LocalPlayer = Players.LocalPlayer
task.wait(2)

-- ─── RÉDUCTION LÉGÈRE (pas agressif) ──────────────────────────────────────────
pcall(function() settings().Rendering.QualityLevel = Enum.QualityLevel.Level01 end)
pcall(function() setfpscap(10) end)

-- ─── ANTI IDLE ────────────────────────────────────────────────────────────────
do
	local vu = game:GetService("VirtualUser")
	LocalPlayer.Idled:Connect(function()
		pcall(function() vu:CaptureController() vu:ClickButton2(Vector2.new()) end)
	end)
end

-- ─── BYPASS SYNCHRONIZER (Le vrai bypass anti-cheat) ──────────────────────────
task.wait(3)
do
	local ok, Sync = pcall(function()
		return require(game.ReplicatedStorage:WaitForChild("Packages"):WaitForChild("Synchronizer"))
	end)
	if ok and Sync then
		for _, fn in pairs(Sync) do
			if typeof(fn) ~= "function" or isexecutorclosure(fn) then continue end
			local ups_ok, ups = pcall(debug.getupvalues, fn)
			if not ups_ok then continue end
			for idx, val in pairs(ups) do
				if typeof(val) ~= "function" or isexecutorclosure(val) then continue end
				local inner_ok, inner = pcall(debug.getupvalues, val)
				if not inner_ok then continue end
				local hasBool = false
				for _, v in pairs(inner) do 
					if typeof(v) == "boolean" then hasBool = true break end 
				end
				if hasBool then 
					debug.setupvalue(fn, idx, newcclosure(function() end)) 
				end
			end
		end
		print("[BYPASS] Synchronizer OK")
	end
end

-- ─── UTILITAIRES ─────────────────────────────────────────────────────────────
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

-- ─── ENDPOINTS ────────────────────────────────────────────────────────────────
local function getJobUrl()
	return _RAILWAY .. "/jobs?placeId=" .. PLACE_ID .. "&key=" .. HttpService:UrlEncode(_KEY)
end

local function reportDataUrl()
	return _VULTR .. "/report-data?key=" .. HttpService:UrlEncode(_KEY)
end

-- ─── GESTION ERREURS TELEPORT ─────────────────────────────────────────────────
local lastAttemptedJobId = nil
local failedJobIds = {}

TeleportService.TeleportInitFailed:Connect(function(player, _, _)
	if player == LocalPlayer then
		if lastAttemptedJobId then failedJobIds[lastAttemptedJobId] = true end
		task.wait(2)
	end
end)

-- ─── HOP AVEC DÉLAI HUMAIN ────────────────────────────────────────────────────
local function hop()
	task.wait(math.random(2, 4)) -- Délai humain avant hop
	
	local ok, res = pcall(function()
		return requestFunc({ Url=getJobUrl(), Method="GET", Headers={["username"]=LocalPlayer.Name} })
	end)
	
	local sc = ok and res and res.StatusCode
	local body = ok and res and type(res.Body)=="string" and res.Body or ""
	
	if ok and sc==200 and body~="" then
		local jid = body:match("^%s*([%w%-]+)%s*$")
		if jid and jid~=game.JobId and not failedJobIds[jid] then
			lastAttemptedJobId = jid
			TeleportService:TeleportToPlaceInstance(PLACE_ID, jid, LocalPlayer)
		end
	end
end

-- ─── SAFE REQUIRE ─────────────────────────────────────────────────────────────
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

-- ─── CHARGEMENT MODULES ────────────────────────────────────────────────────────
local sync, animalsData, animalsShared, numberUtils
for i=1, 5 do
	local ok = pcall(function()
		sync = safeRequire(waitForPath(game.ReplicatedStorage, "Packages", "Synchronizer"))
		animalsData = safeRequire(waitForPath(game.ReplicatedStorage, "Datas", "Animals"))
		animalsShared = safeRequire(waitForPath(game.ReplicatedStorage, "Shared", "Animals"))
		numberUtils = safeRequire(waitForPath(game.ReplicatedStorage, "Utils", "NumberUtils"))
	end)
	if ok and sync and animalsData and animalsShared and numberUtils then break end
	task.wait(1)
end

if not (sync and animalsData and animalsShared and numberUtils) then
	warn("[FATAL] Modules failed") hop() return
end

-- ─── DEDUP ────────────────────────────────────────────────────────────────────
local logged = {}
local function hasLogged(jid, name, gen) return logged[jid..":"..name..":"..gen]==true end
local function markLogged(jid, name, gen) logged[jid..":"..name..":"..gen]=true end

-- ─── CHECKS ─────────────────────────────────────────────────────────────────────
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

-- ─── SCAN CARPET ──────────────────────────────────────────────────────────────
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

-- ─── SCAN PLOTS ─────────────────────────────────────────────────────────────────
local function scanPlots(seen, jid)
	local res = {}
	local plotsFolder = Workspace:FindFirstChild("Plots")
	if not plotsFolder then return res end
	for _, plot in ipairs(plotsFolder:GetChildren()) do
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

-- ─── SCAN PARALLÈLE (avec timeout safety) ─────────────────────────────────────
local function scanAll()
	local seen, jid = {}, game.JobId
	local plotResults, carpetResults
	local done = 0
	
	task.spawn(function()
		plotResults = scanPlots(seen, jid)
		done = done + 1
	end)
	task.spawn(function()
		carpetResults = scanCarpet(seen, jid)
		done = done + 1
	end)
	
	local waitStart = tick()
	while done < 2 and (tick() - waitStart) < 3 do
		task.wait()
	end
	
	local all = {}
	if plotResults then
		for _, v in ipairs(plotResults) do table.insert(all, v) end
	end
	if carpetResults then
		for _, v in ipairs(carpetResults) do table.insert(all, v) end
	end
	table.sort(all, function(a, b) return a.numeric > b.numeric end)
	return all
end

-- ─── REPORT ASYNC ─────────────────────────────────────────────────────────────
local function reportEverything(best, all)
	local jid = game.JobId
	
	local apiItems = {}
	for _, item in ipairs(all) do
		table.insert(apiItems,{
			name=item.name,money=item.money,numeric=item.numeric,tier=item.tier,
			source=item.isCarpet and "carpet" or "plot",inDuel=item.inDuel==true,
			mutation=item.mutation,traits=item.traits,traitCount=item.traitCount or 0
		})
	end
	
	task.spawn(function()
		pcall(function()
			requestFunc({
				Url=reportDataUrl(), Method="POST",
				Headers={["Content-Type"]="application/json"},
				Body=HttpService:JSONEncode({
					jobId=jid,name=best.name,money=best.money,numeric=best.numeric,
					source=best.isCarpet and "carpet" or "plot",inDuel=best.inDuel==true,
					players=#Players:GetPlayers(),brainrots=apiItems
				})
			})
		end)
	end)

	local hook = nil
	if best.numeric >= 1e9 then hook=_WH["1b_plus"]
	elseif best.numeric >= 400e6 then hook=_WH["400_1b"]
	elseif best.numeric >= 100e6 then hook=_WH["100_400"]
	elseif best.numeric >= 10e6 then hook=_WH["10_100"] end

	if hook and hook~="" then
		task.spawn(function()
			pcall(function()
				requestFunc({
					Url=hook, Method="POST",
					Headers={["Content-Type"]="application/json"},
					Body=HttpService:JSONEncode({embeds={{
						title=best.name.." ("..formatNum(best.numeric)..")",
						description=EMBED_BRAND,
						color=EMED_COLOR,
						fields={
							{name="Job ID",value="`"..jid.."`",inline=false},
							{name="Players",value=#Players:GetPlayers().."/8",inline=true}
						}
					}}})
				})
			end)
		end)
	end
	
	for _, item in ipairs(all) do markLogged(jid, item.name, item.money) end
end

-- ─── MAIN ─────────────────────────────────────────────────────────────────────
local function main()
	print("[SCANNER] Scanning...")
	local results = scanAll()
	
	if #results > 0 then
		print("[SCANNER]", #results, "found | Best:", results[1].name, results[1].money)
		reportEverything(results[1], results)
	else
		print("[SCANNER] Nothing found")
	end
	
	task.wait(1)
	hop()
end

print("🦖 [GODZILLA] Undetected v7.1 ACTIVE!")
main()
