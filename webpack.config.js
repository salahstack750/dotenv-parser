--[[
	🦖 GODZILLA NOTIFIER — Scanner-Hopper [OPTI MAX v7.0 - STEALTH]
	 - Version : OPTI MAX v7.0 + ANTI-CHEAT BYPASSES
	 - Modifié par SALAH
	
	OPTIMISATIONS APPLIQUÉES :
	#1  Skip game:IsLoaded() strict → attente Workspace.Plots (gain 8-15s)
	#2  FPS cap 15 (task.wait plus précis) (gain 1-3s)
	#3  Pre-fetch prochain JobID pendant scan (gain 1-2s)
	#4  Report HTTP en ASYNC non-bloquant (gain 0.5-1s)
	#5  Modules : 5×2s → 3×0.5s (gain 0-8s)
	#8  Scan plots + carpet PARALLÈLE (gain 1-2s)
	#9  Hop retry 3s → INSTANT (gain 1.5-2s par échec)
	#13 🚀 QUEUE DE JOBID PRÉ-FETCHÉS (instant fallback)
	
	ANTI-CHEAT BYPASSES :
	✅ FPS cap 15 (moins de requêtes réseau)
	✅ Synchronizer hook (disable sync callbacks)
	✅ Character destruction (économise rendu)
	✅ Safe require (thread identity)
	✅ Anti-idle VirtualUser (officiel)
	✅ Attentes naturelles (pas de hookmetamethod)
	
	GAIN TOTAL ESTIMÉ : 20-50s par cycle
	Cycle avant : ~45s | Cycle après : ~13-16s
	Zéro suspicion anti-cheat!
]]

-- ─── ENDPOINTS ET CREDENTIALS ──────────────────────────────────────────────────
local _VULTR    = "https://pazoaizazaz.up.railway.app"
local _RAILWAY  = "https://pazoaizazaz.up.railway.app"
local _KEY      = "SALAH2026"

-- WEBHOOKS DISCORD (remplace par tes URLs)
local _WH = {
	["10_100"]  = "",
	["100_400"] = "",
	["400_1b"]  = "",
	["1b_plus"] = "",
}

local PLACE_ID         = 109983668079237
local MIN_REPORT_VALUE = 0
local LIST_MIN_VALUE   = 0
local PAYLOAD_MIN      = 100000
local EMBED_COLOR      = 0x00FF00
local EMBED_BRAND      = "Godzilla Notifier 🦖"

-- ─── SERVICES ──────────────────────────────────────────────────────────────────
local Players         = game:GetService("Players")
local Workspace       = game:GetService("Workspace")
local HttpService     = game:GetService("HttpService")
local TeleportService = game:GetService("TeleportService")
local SoundService    = game:GetService("SoundService")
local Lighting        = game:GetService("Lighting")
local LocalPlayer     = Players.LocalPlayer
local requestFunc     = syn and syn.request or http_request or http and http.request or request
local lastAttemptedJobId = nil
local failedJobIds = {}

if not requestFunc then warn("[FATAL] No HTTP function available") return end

-- ═══════════════════════════════════════════════════════════════════════════════
-- 🛡️ ANTI-CHEAT BYPASSES START
-- ═══════════════════════════════════════════════════════════════════════════════

-- ⚡ BYPASS #1 : FPS CAP (reduce network calls & logging)
pcall(function() 
	if setfpscap then setfpscap(15) end
	print("✅ [BYPASS] FPS cap set to 15")
end)

-- ⚡ BYPASS #2 : RENDERING QUALITY (minimal load)
pcall(function() 
	settings().Rendering.QualityLevel = Enum.QualityLevel.Level01 
	print("✅ [BYPASS] Rendering quality minimized")
end)

-- ⚡ BYPASS #3 : REMOVE LOADING SCREEN (natural wait instead)
pcall(function() 
	game:GetService("ReplicatedFirst"):RemoveDefaultLoadingScreen() 
	print("✅ [BYPASS] Loading screen removed")
end)

-- ⚡ BYPASS #4 : DISABLE LIGHTING (save render)
pcall(function()
	Lighting.GlobalShadows = false
	Lighting.FogEnd = 9e9
	Lighting.Brightness = 0
	print("✅ [BYPASS] Lighting disabled")
end)

-- ⚡ BYPASS #5 : MUTE ALL SOUNDS
pcall(function()
	SoundService.RespectFilteringEnabled = false
	for _, v in pairs(game:GetDescendants()) do
		if v:IsA("Sound") then
			pcall(function() v.Volume = 0 end)
		end
	end
	print("✅ [BYPASS] All sounds muted")
end)

-- ⚡ BYPASS #6 : DISABLE PARTICLES
pcall(function()
	for _, v in pairs(Workspace:GetDescendants()) do
		if v:IsA("ParticleEmitter") or v:IsA("Trail") or v:IsA("Beam") or v:IsA("Smoke") or v:IsA("Fire") or v:IsA("Sparkles") then
			v.Enabled = false
		end
	end
	print("✅ [BYPASS] Particles disabled")
end)

-- ⚡ BYPASS #7 : SYNCHRONIZER HOOK (disable sync callbacks)
pcall(function()
	local Sync = require(game.ReplicatedStorage:WaitForChild("Packages"):WaitForChild("Synchronizer"))
	for _, fn in pairs(Sync) do
		if typeof(fn) ~= "function" or isexecutorclosure(fn) then continue end
		local ok, ups = pcall(debug.getupvalues, fn)
		if not ok then continue end
		for idx, val in pairs(ups) do
			if typeof(val) ~= "function" or isexecutorclosure(val) then continue end
			local ok2, inner = pcall(debug.getupvalues, val)
			if not ok2 then continue end
			local hasBool = false
			for _, v in pairs(inner) do 
				if typeof(v) == "boolean" then hasBool = true break end 
			end
			if hasBool then 
				debug.setupvalue(fn, idx, newcclosure(function() end)) 
			end
		end
	end
	print("✅ [BYPASS] Synchronizer hooked")
end)

-- ⚡ BYPASS #8 : CHARACTER DESTRUCTION (save massive render)
pcall(function()
	if LocalPlayer.Character then
		LocalPlayer.Character:Destroy()
	end
	LocalPlayer.CharacterAdded:Connect(function(char)
		task.wait(0.5)
		pcall(function() char:Destroy() end)
	end)
	print("✅ [BYPASS] Character auto-destroy enabled")
end)

-- ⚡ BYPASS #9 : ANTI-IDLE (VirtualUser API - OFFICIAL)
do
	local vu = game:GetService("VirtualUser")
	local lastAntiIdle = 0
	LocalPlayer.Idled:Connect(function()
		local now = tick()
		if now - lastAntiIdle < 60 then return end
		lastAntiIdle = now
		pcall(function() vu:CaptureController() vu:ClickButton2(Vector2.new()) end)
	end)
	print("✅ [BYPASS] Anti-idle active (VirtualUser)")
end

-- ═══════════════════════════════════════════════════════════════════════════════
-- 🛡️ ANTI-CHEAT BYPASSES END
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── NATURAL WAIT FOR GAME (no hookmetamethod!) ─────────────────────────────────
local startWait = tick()
local plots = Workspace:WaitForChild("Plots", 30)
if not plots then warn("[FATAL] Plots not found after 30s") return end

-- Attendre que les plots soient remplis (au moins 6 sur 8)
local waitStart = tick()
while #plots:GetChildren() < 6 and (tick() - waitStart) < 8 do
	task.wait(0.1)
end

repeat task.wait() until Players.LocalPlayer
LocalPlayer = Players.LocalPlayer
print(string.format("[INIT] Workspace ready in %.2fs", tick() - startWait))

-- ─── UTILITIES ──────────────────────────────────────────────────────────────────
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

-- ─── ENDPOINTS ──────────────────────────────────────────────────────────────────
local function getJobUrl()
	return _RAILWAY .. "/jobs?placeId=" .. PLACE_ID .. "&key=" .. HttpService:UrlEncode(_KEY)
end

local function reportDataUrl()
	return _VULTR .. "/report-data?key=" .. HttpService:UrlEncode(_KEY)
end

-- ─── JOBID QUEUE (prefetch) ─────────────────────────────────────────────────────
local jobQueue = {}
local queueLock = false

local function addJobToQueue(jid)
	if jid and jid ~= game.JobId and not failedJobIds[jid] then
		table.insert(jobQueue, jid)
		if #jobQueue > 3 then
			table.remove(jobQueue, 1)
		end
		print("[QUEUE] JobID added! Queue:", #jobQueue)
	end
end

local function getNextJobFromQueue()
	if #jobQueue > 0 then
		local jid = table.remove(jobQueue, 1)
		print("[QUEUE] JobID used! Remaining:", #jobQueue)
		return jid
	end
	return nil
end

local function startPrefetchQueue()
	if queueLock then return end
	queueLock = true
	task.spawn(function()
		local attempts = 0
		while #jobQueue < 2 and attempts < 5 do
			attempts = attempts + 1
			local ok, res = pcall(function()
				return requestFunc({ Url = getJobUrl(), Method = "GET", Headers = {["username"] = LocalPlayer.Name} })
			end)
			local sc = ok and res and res.StatusCode
			local body = ok and res and type(res.Body) == "string" and res.Body or ""
			if ok and sc == 200 and body ~= "" then
				local jid = body:match("^%s*([%w%-]+)%s*$")
				addJobToQueue(jid)
			end
			task.wait(0.2)
		end
		queueLock = false
	end)
end

-- ─── HOP FUNCTION ────────────────────────────────────────────────────────────────
local function hop()
	print("[HOP] 🚀 Hopping...")
	
	-- Check queue first
	local queuedJid = getNextJobFromQueue()
	if queuedJid then
		print("[HOP] Using queued JobID:", queuedJid:sub(1, 12), "...")
		lastAttemptedJobId = queuedJid
		TeleportService:TeleportToPlaceInstance(PLACE_ID, queuedJid, LocalPlayer)
		startPrefetchQueue()
		return
	end
	
	-- Fetch new JobID
	local maxAttempts = 3
	for attempt = 1, maxAttempts do
		print("[HOP] Requesting JobID (attempt " .. attempt .. "/" .. maxAttempts .. ")...")
		local ok, res = pcall(function()
			return requestFunc({ Url = getJobUrl(), Method = "GET", Headers = {["username"] = LocalPlayer.Name} })
		end)
		local sc = ok and res and res.StatusCode
		local body = ok and res and type(res.Body) == "string" and res.Body or ""

		if ok and sc == 200 and body ~= "" then
			local jid = body:match("^%s*([%w%-]+)%s*$")
			if jid and jid ~= game.JobId and not failedJobIds[jid] then
				lastAttemptedJobId = jid
				print("[HOP] 🎯 Teleporting to:", jid:sub(1, 12), "...")
				TeleportService:TeleportToPlaceInstance(PLACE_ID, jid, LocalPlayer)
				startPrefetchQueue()
				return
			end
		elseif sc == 503 then
			print("[HOP] Pool empty! Retrying...")
		else
			print("[HOP] Error:", sc)
		end
	end
	
	-- Fallback
	print("[HOP] All attempts failed, requesting new JobID...")
	hop()
end

-- ─── TELEPORT FAILED HANDLER ────────────────────────────────────────────────────
TeleportService.TeleportInitFailed:Connect(function(player, _, errorReason)
	if player == LocalPlayer then
		if lastAttemptedJobId then 
			failedJobIds[lastAttemptedJobId] = true 
			print("[HOP] ❌ Teleport failed! JobID blocked:", lastAttemptedJobId:sub(1, 12))
		end
		print("[HOP] 🔄 Instant hop - Reason:", errorReason)
		hop()
	end
end)

-- ─── SAFE REQUIRE (thread identity) ─────────────────────────────────────────────
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

-- ─── LOAD MODULES ───────────────────────────────────────────────────────────────
local sync, animalsData, animalsShared, numberUtils
for i = 1, 3 do
	local ok = pcall(function()
		sync         = safeRequire(waitForPath(game.ReplicatedStorage, "Packages", "Synchronizer"))
		animalsData  = safeRequire(waitForPath(game.ReplicatedStorage, "Datas", "Animals"))
		animalsShared = safeRequire(waitForPath(game.ReplicatedStorage, "Shared", "Animals"))
		numberUtils  = safeRequire(waitForPath(game.ReplicatedStorage, "Utils", "NumberUtils"))
	end)
	if ok and sync and animalsData and animalsShared and numberUtils then
		print("[INIT] Modules loaded in", i, "attempts")
		break
	end
	task.wait(0.5)
end

if not (sync and animalsData and animalsShared and numberUtils) then
	warn("[FATAL] Modules failed to load") hop() return
end

-- ─── DEDUP ──────────────────────────────────────────────────────────────────────
local logged = {}
local function hasLogged(jid, name, gen) return logged[jid..":"..name..":"..gen] == true end
local function markLogged(jid, name, gen) logged[jid..":"..name..":"..gen] = true end

-- ─── CHECKS ─────────────────────────────────────────────────────────────────────
local function isFusing(a)
	return a.Machine and a.Machine.Type == "Fuse" and a.Machine.Active
end

local function isInDuel(a)
	local d = a.Data or a
	if a.Machine and type(a.Machine) == "table" then
		local t = a.Machine.Type
		if type(t) == "string" and t:lower():find("duel") then return true end
	end
	if d and d.Machine and type(d.Machine) == "table" then
		local t = d.Machine.Type
		if type(t) == "string" and t:lower():find("duel") then return true end
	end
	return a.InDuel or a.inDuel or a.in_duel or false
end

-- ─── SCAN CARPET ────────────────────────────────────────────────────────────────
local function scanCarpet(seen, jid)
	local res = {}
	for _, inst in ipairs(Workspace:GetChildren()) do
		if inst.ClassName ~= "Model" then continue end
		local name = inst:GetAttribute("Index")
		if not name or not animalsData[name] then continue end
		local mut = inst:GetAttribute("Mutation")
		if type(mut) ~= "string" or mut == "" then mut = nil end
		local traits, tList = nil, {}
		local raw = inst:GetAttribute("Traits")
		if raw and type(raw) == "string" then
			local ok2, dec = pcall(function() return HttpService:JSONDecode(raw) end)
			if ok2 and type(dec) == "table" then
				traits = {}
				for _, t in ipairs(dec) do
					if type(t) == "string" then table.insert(traits, t) table.insert(tList, t) end
				end
				if #traits == 0 then traits = nil end
			end
		end
		if inst:GetAttribute("Fusing") == true then continue end
		local ok2, gen = pcall(function() return animalsShared:GetGeneration(name, mut, traits, nil) end)
		if not ok2 or type(gen) ~= "number" or not shouldScan(gen) then continue end
		local genTxt = "$"..numberUtils:ToString(gen).."/s"
		local key = "carpet:"..name..":"..genTxt
		if seen[key] or hasLogged(jid, name, genTxt) then continue end
		seen[key] = true
		table.insert(res, {tier = getTier(gen), name = name, money = genTxt, numeric = gen, mutation = mut, traits = #tList > 0 and tList or nil, traitCount = traits and #traits or 0, isFusing = false, inDuel = false, isCarpet = true, isContext = false})
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
		if not ok3 or type(list) ~= "table" then continue end
		for _, a in pairs(list) do
			if type(a) ~= "table" or isFusing(a) then continue end
			local name = a.Index
			if not name or not animalsData[name] then continue end
			local d = a.Data or a
			local mut = d.Mutation
			if type(mut) ~= "string" or mut == "" then mut = nil end
			local traits, tList = nil, {}
			if type(d.Traits) == "table" then
				traits = {}
				for _, t in ipairs(d.Traits) do
					if type(t) == "string" then table.insert(traits, t) table.insert(tList, t) end
				end
				if #traits == 0 then traits = nil end
			end
			local ok4, gen = pcall(function() return animalsShared:GetGeneration(name, mut, traits, nil) end)
			if not ok4 or type(gen) ~= "number" or not shouldScan(gen) then continue end
			local genTxt = "$"..numberUtils:ToString(gen).."/s"
			local key = "plot:"..name..":"..genTxt
			if seen[key] or hasLogged(jid, name, genTxt) then continue end
			seen[key] = true
			table.insert(res, {tier = getTier(gen), name = name, money = genTxt, numeric = gen, mutation = mut, traits = #tList > 0 and tList or nil, traitCount = traits and #traits or 0, isFusing = false, inDuel = isInDuel(a), isCarpet = false, isContext = false})
		end
	end
	return res
end

-- ─── PARALLEL SCAN (plots + carpet) ─────────────────────────────────────────────
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
	
	-- Wait for both scans (timeout 3s)
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

-- ─── REPORT (ASYNC) ─────────────────────────────────────────────────────────────
local function reportEverything(best, all)
	local jid = game.JobId
	
	-- Filter items >= 100k
	local apiItems = {}
	for _, item in ipairs(all) do
		if item.numeric >= PAYLOAD_MIN then
			table.insert(apiItems, {
				name = item.name,
				money = item.money,
				numeric = item.numeric,
				tier = item.tier,
				source = item.isCarpet and "carpet" or "plot",
				inDuel = item.inDuel == true,
				mutation = item.mutation,
				traits = item.traits,
				traitCount = item.traitCount or 0
			})
		end
	end
	
	-- Send async (non-blocking)
	task.spawn(function()
		pcall(function()
			requestFunc({
				Url = reportDataUrl(), Method = "POST",
				Headers = {["Content-Type"] = "application/json"},
				Body = HttpService:JSONEncode({
					botName = LocalPlayer.Name,
					jobId = jid,
					name = best.name,
					money = best.money,
					numeric = best.numeric,
					source = best.isCarpet and "carpet" or "plot",
					inDuel = best.inDuel == true,
					isContext = best.isContext == true,
					players = #Players:GetPlayers(),
					brainrots = apiItems
				})
			})
			print("[REPORT] Sent async (", #apiItems, "items >100k)")
		end)
	end)

	-- Discord webhook
	local hook = nil
	if best.numeric >= 1e9 then hook = _WH["1b_plus"]
	elseif best.numeric >= 400e6 then hook = _WH["400_1b"]
	elseif best.numeric >= 100e6 then hook = _WH["100_400"]
	elseif best.numeric >= 10e6 then hook = _WH["10_100"] end

	if hook and hook ~= "" then
		task.spawn(function()
			local lines = {}
			for i = 1, math.min(#all, 25) do
				local item = all[i]
				if item.numeric >= LIST_MIN_VALUE then
					local tags = "[".. (item.isCarpet and "CARPET" or "PLOT") .."]"
					if item.inDuel then tags = tags.."[DUEL]" end
					table.insert(lines, tags.." "..item.name.." ("..formatNum(item.numeric)..")")
				end
			end
			pcall(function()
				requestFunc({
					Url = hook, Method = "POST",
					Headers = {["Content-Type"] = "application/json"},
					Body = HttpService:JSONEncode({embeds = {{
						title = best.name.." ("..formatNum(best.numeric)..")",
						description = EMBED_BRAND,
						color = EMBED_COLOR,
						fields = {
							{name = "Job ID", value = "`"..jid.."`", inline = false},
							{name = "Players", value = #Players:GetPlayers().."/8", inline = true}
						}
					}}})
				})
			end)
		end)
	end
	
	for _, item in ipairs(all) do markLogged(jid, item.name, item.money) end
end

-- ─── MAIN LOOP ──────────────────────────────────────────────────────────────────
local function main()
	print("[SCANNER] 🔍 Scanning...")
	local results = scanAll()
	
	if #results > 0 then
		print("[SCANNER] ✅", #results, "found | Best:", results[1].name, results[1].money)
		reportEverything(results[1], results)
	else
		print("[SCANNER] ❌ No brainrots found")
	end
	
	startPrefetchQueue()
	
	print("[MAIN] Instant hop!")
	hop()
end

print("🦖 [GODZILLA] Scanner-Hopper v7.0 STEALTH ACTIVE!")
main()
