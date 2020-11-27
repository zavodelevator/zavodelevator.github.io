s = []


1.upto(87) do |i|

    s << "1 (#{i}).eml"

end

s.each do |w|
    
    input = File.open(w, "r")
    output = File.open("email.txt", "a")
    
    @num = 0
    while (line = input.gets)
      @num = @num+1
      if @num > 4 && line[0..3]=="To: "
        puts line
        output.write "#{line}\n"
      end
    
      if @num > 9
        @num = 0 
        break
      end
    end
    
    input.close
    output.close

end


