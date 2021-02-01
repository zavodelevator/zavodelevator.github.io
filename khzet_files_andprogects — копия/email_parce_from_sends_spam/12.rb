input = File.open("email.txt", "r")
output = File.open("email2.txt", "a")

@lines = []
while (line = input.gets)
    @lines << line  
end

@lines = @lines.uniq.sort

@lines.each do |ii|
    output.write "#{ii}"
end

input.close
output.close
