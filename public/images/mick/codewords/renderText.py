import PIL
from PIL import ImageFont
from PIL import Image
from PIL import ImageDraw

list = []

with open('wordlist.txt') as inputfile:
    for line in inputfile:
        s = line.replace(" ","")
        s = s.replace("\n","")
        list.append(s)

#print(list)
for i in list:
    # font = ImageFont.truetype("Arial-Bold.ttf",14)
   #font = ImageFont.load_default().font
   # use a truetype font
   font = ImageFont.truetype("arial.ttf", 30)
   img=Image.new("RGBA", (225,125),(255,255,255))
   draw = ImageDraw.Draw(img)
   draw.text((5, 47),i,(0,0,0),font=font)
   draw = ImageDraw.Draw(img)
   img.save(i+".png")
