require "host"
require "common"

strip = common.strip

h = host.host()

running = true

function on_password(client)
    client:switch_status( host.status.read )
end
h.status_callbacks[host.status.password] = on_password


function split(str)
    local stripped = strip(str)
    local index = string.find(stripped, " ")
    if index then
        return string.sub(stripped, 0, index - 1), strip(string.sub(stripped, index))
    else
        return str
    end
end

function process_command(client)
    local cmd, arg = split(client.buffer)
    client.buffer = ""
    if cmd == "time" then
        local input = vlc.object.input()
        if input then
            if arg then
                vlc.var.set(input, "time", tonumber(arg))
            end
            client:append("time " .. vlc.var.get(input, "time"))
        end
    elseif cmd == "status" then
        client:append("status " .. vlc.playlist.status())
    elseif cmd == "pause" then
        vlc.playlist.pause(nil, nil)
    end
end

h:listen("*console")
while running do
    local write, read = h:accept_and_select()
    for _, client in pairs(write) do
        local len = client:send()
        client.buffer = string.sub(client.buffer, len + 1)
        if client.buffer == "" then client:switch_status(host.status.read) end
    end
    for _, client in pairs(read) do
        local input = client:recv(1000)
        if input == nil then
            client.cmds = "quit\n"
        else
            client.cmds = client.cmds .. input
        end

        client.buffer = ""
        
        while string.find(client.cmds, "\n") do
            local buffer = client.buffer
    
            local index = string.find(client.cmds, "\n")
            client.buffer = strip(string.sub(client.cmds, 0, index - 1))
            client.cmds = string.sub(client.cmds, index + 1)
    
            client:switch_status(host.status.write)
            process_command(client)
            client.buffer = buffer .. client.buffer
        end
    end
    
    
end
