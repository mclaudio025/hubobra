import os

content = 'export async function GET() { return new Response("Em construcao"); }'

for r, d, fl in os.walk('frontend/src/app'):
    for f in fl:
        if f.endswith('route.ts'):
            path = os.path.join(r, f)
            with open(path, 'w', encoding='utf-8') as file:
                file.write(content)
print("Route handlers updated.")
