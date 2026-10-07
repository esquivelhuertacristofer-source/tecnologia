/* Generado por scratchpad/n7/generar-m4.py con CPython 3.14.3. No se edita a mano. */
export const MEDIDO_EN_CPYTHON: readonly { nombre: string; archivos: Record<string, string>; programa: string; salida: string[]; familia: string | null }[] = [
  {
    "nombre": "math",
    "archivos": {},
    "programa": "import math\nprint(math.sqrt(16), math.sqrt(2))\nprint(math.floor(2.7), math.floor(-2.5), math.ceil(2.1), math.ceil(5))\nprint(math.pi, type(math.floor(2.7)), type(math.sqrt(4)))\nprint(math.floor(True), math.ceil(-0.5))",
    "salida": [
      "4.0 1.4142135623730951",
      "2 -3 3 5",
      "3.141592653589793 <class 'int'> <class 'float'>",
      "1 0"
    ],
    "familia": null
  },
  {
    "nombre": "statistics.mean",
    "archivos": {},
    "programa": "import statistics\nfor d in [[1, 2, 3, 4], [2, 4], [1, 2, 4], [1.0, 2.0], [1, 2.5], [0.1, 0.2, 0.3], [1e16, 1.0, -1e16], [5], [True, 3], [0.1, 0.7, 1]]:\n    print(statistics.mean(d))",
    "salida": [
      "2.5",
      "3",
      "2.3333333333333335",
      "1.5",
      "1.75",
      "0.2",
      "0.3333333333333333",
      "5",
      "2",
      "0.6"
    ],
    "familia": null
  },
  {
    "nombre": "statistics.median",
    "archivos": {},
    "programa": "import statistics\nfor d in [[3, 1, 2], [1, 2, 3, 4], [1, 3], [2, 4], [2.5], [True, 3], [5, 1, 4, 2]]:\n    print(statistics.median(d))",
    "salida": [
      "2",
      "2.5",
      "2.0",
      "3.0",
      "2.5",
      "2.0",
      "3.0"
    ],
    "familia": null
  },
  {
    "nombre": "sum compensada",
    "archivos": {},
    "programa": "print(sum([0.1] * 10))\nprint(sum([1e16, 1.0, 1, -1e16]))\nprint(sum([1, 0.1, 0.2]))\nprint(sum([0.1, 0.2, 0.3]))\nprint(sum([1, 2, 3]))\nprint(sum([True, 2.5]))\nprint(sum([]))\nprint(sum([2.5, True, 1]))",
    "salida": [
      "1.0",
      "2.0",
      "1.3",
      "0.6",
      "6",
      "3.5",
      "0",
      "4.5"
    ],
    "familia": null
  },
  {
    "nombre": "import as y from",
    "archivos": {},
    "programa": "import statistics as st\nprint(st.median([5, 1, 3]))\nfrom math import sqrt, pi\nprint(sqrt(9), pi)\nfrom statistics import mean as promedio\nprint(promedio([1, 2]))",
    "salida": [
      "3",
      "3.0 3.141592653589793",
      "1.5"
    ],
    "familia": null
  },
  {
    "nombre": "módulo propio",
    "archivos": {
      "clima.py": "UMBRAL = 15\nprint(\"cargando\", __name__)\ndef f(t):\n    return t < UMBRAL\n"
    },
    "programa": "import clima\nimport clima\nUMBRAL = 99\nprint(clima.f(10), clima.UMBRAL, __name__)\nfrom clima import f\nprint(f(20))\nprint(type(clima))",
    "salida": [
      "cargando clima",
      "True 15 __main__",
      "False",
      "<class 'module'>"
    ],
    "familia": null
  },
  {
    "nombre": "módulo con su prueba guardada",
    "archivos": {
      "utiles.py": "def doble(x):\n    return x * 2\n\nif __name__ == \"__main__\":\n    print(\"probando\", doble(4))\n"
    },
    "programa": "from utiles import doble\nprint(doble(21))",
    "salida": [
      "42"
    ],
    "familia": null
  },
  {
    "nombre": "import dentro de una función",
    "archivos": {
      "utiles.py": "def doble(x):\n    return x * 2\n\nif __name__ == \"__main__\":\n    print(\"probando\", doble(4))\n"
    },
    "programa": "def usa():\n    import utiles\n    return utiles.doble(5)\nprint(usa())\nprint(usa())",
    "salida": [
      "10",
      "10"
    ],
    "familia": null
  },
  {
    "nombre": "leer entero y otra vez",
    "archivos": {
      "ventas.csv": "dia,venta\nlunes,120\nmartes,340\n"
    },
    "programa": "f = open(\"ventas.csv\")\nprint(repr(f.read()))\nprint(repr(f.read()))\nf.close()",
    "salida": [
      "'dia,venta\\nlunes,120\\nmartes,340\\n'",
      "''"
    ],
    "familia": null
  },
  {
    "nombre": "recorrer sin salto final",
    "archivos": {
      "n.txt": "uno\ndos"
    },
    "programa": "f = open(\"n.txt\")\nfor linea in f:\n    print(repr(linea))\nf.close()",
    "salida": [
      "'uno\\n'",
      "'dos'"
    ],
    "familia": null
  },
  {
    "nombre": "readlines y readline",
    "archivos": {
      "ventas.csv": "dia,venta\nlunes,120\nmartes,340\n"
    },
    "programa": "f = open(\"ventas.csv\")\nprint(f.readlines())\nf.close()\ng = open(\"ventas.csv\", \"r\")\nprint(repr(g.readline()), repr(g.readline()), repr(g.readline()), repr(g.readline()))\ng.close()",
    "salida": [
      "['dia,venta\\n', 'lunes,120\\n', 'martes,340\\n']",
      "'dia,venta\\n' 'lunes,120\\n' 'martes,340\\n' ''"
    ],
    "familia": null
  },
  {
    "nombre": "with y split",
    "archivos": {
      "ventas.csv": "dia,venta\nlunes,120\nmartes,340\n"
    },
    "programa": "total = 0\nwith open(\"ventas.csv\") as f:\n    f.readline()\n    for linea in f:\n        dia, venta = linea.strip().split(\",\")\n        total = total + int(venta)\n        print(dia, venta)\nprint(total)",
    "salida": [
      "lunes 120",
      "martes 340",
      "460"
    ],
    "familia": null
  },
  {
    "nombre": "escribir y leer lo escrito",
    "archivos": {},
    "programa": "f = open(\"nota.txt\", \"w\")\nprint(f.write(\"hola\\n\"))\nf.write(\"adiós\")\nf.close()\ng = open(\"nota.txt\", \"a\")\ng.write(\"!\")\ng.close()\nprint(repr(open(\"nota.txt\").read()))",
    "salida": [
      "5",
      "'hola\\nadiós!'"
    ],
    "familia": null
  },
  {
    "nombre": "w borra lo de antes",
    "archivos": {
      "nota.txt": "viejo\n"
    },
    "programa": "with open(\"nota.txt\", \"w\") as f:\n    f.write(\"nuevo\")\nwith open(\"nota.txt\") as f:\n    print(f.read())",
    "salida": [
      "nuevo"
    ],
    "familia": null
  },
  {
    "nombre": "el for sobre las líneas de readlines",
    "archivos": {
      "ventas.csv": "dia,venta\nlunes,120\nmartes,340\n"
    },
    "programa": "lineas = open(\"ventas.csv\").readlines()\nprint(len(lineas), lineas[0].strip())",
    "salida": [
      "3 dia,venta"
    ],
    "familia": null
  },
  {
    "nombre": "repr de textos",
    "archivos": {},
    "programa": "print(repr(\"it's\"), repr('di \"hola\"'), repr('a\\'b\"c'), repr(\"t\\tab\"), [\"it's\"])\nprint(repr(3), repr(2.5), repr([1, \"x\"]))",
    "salida": [
      "\"it's\" 'di \"hola\"' 'a\\'b\"c' 't\\tab' [\"it's\"]",
      "3 2.5 [1, 'x']"
    ],
    "familia": null
  },
  {
    "nombre": "print con saltos",
    "archivos": {
      "n.txt": "uno\ndos\n"
    },
    "programa": "print(\"a\\nb\")\nprint(open(\"n.txt\").read())\nprint(\"fin\")",
    "salida": [
      "a",
      "b",
      "uno",
      "dos",
      "",
      "fin"
    ],
    "familia": null
  },
  {
    "nombre": "archivo que no existe",
    "archivos": {
      "ventas.csv": "dia,venta\nlunes,120\nmartes,340\n"
    },
    "programa": "print(\"antes\")\nf = open(\"ventas.txt\")",
    "salida": [
      "antes"
    ],
    "familia": "FileNotFoundError"
  },
  {
    "nombre": "leer cerrado",
    "archivos": {
      "ventas.csv": "dia,venta\nlunes,120\nmartes,340\n"
    },
    "programa": "f = open(\"ventas.csv\")\nf.close()\nf.read()",
    "salida": [],
    "familia": "ValueError"
  },
  {
    "nombre": "leer después del with",
    "archivos": {
      "ventas.csv": "dia,venta\nlunes,120\nmartes,340\n"
    },
    "programa": "with open(\"ventas.csv\") as f:\n    pass\nprint(f.read())",
    "salida": [],
    "familia": "ValueError"
  },
  {
    "nombre": "leer uno abierto para escribir",
    "archivos": {},
    "programa": "f = open(\"x.txt\", \"w\")\nf.read()",
    "salida": [],
    "familia": "UnsupportedOperation"
  },
  {
    "nombre": "escribir un número",
    "archivos": {},
    "programa": "f = open(\"x.txt\", \"w\")\nf.write(5)",
    "salida": [],
    "familia": "TypeError"
  },
  {
    "nombre": "escribir en uno abierto para leer",
    "archivos": {
      "ventas.csv": "dia,venta\nlunes,120\nmartes,340\n"
    },
    "programa": "f = open(\"ventas.csv\")\nf.write(\"x\")",
    "salida": [],
    "familia": "UnsupportedOperation"
  },
  {
    "nombre": "modo raro",
    "archivos": {},
    "programa": "open(\"x.txt\", \"rw\")",
    "salida": [],
    "familia": "ValueError"
  },
  {
    "nombre": "módulo que no existe",
    "archivos": {},
    "programa": "import climaa",
    "salida": [],
    "familia": "ModuleNotFoundError"
  },
  {
    "nombre": "nombre que el módulo no tiene",
    "archivos": {
      "clima.py": "UMBRAL = 15\nprint(\"cargando\", __name__)\ndef f(t):\n    return t < UMBRAL\n"
    },
    "programa": "from clima import g",
    "salida": [
      "cargando clima"
    ],
    "familia": "ImportError"
  },
  {
    "nombre": "math sin eso",
    "archivos": {},
    "programa": "import math\nprint(math.nada)",
    "salida": [],
    "familia": "AttributeError"
  },
  {
    "nombre": "media de nada",
    "archivos": {},
    "programa": "import statistics\nprint(statistics.mean([]))",
    "salida": [],
    "familia": "StatisticsError"
  },
  {
    "nombre": "mediana de nada",
    "archivos": {},
    "programa": "import statistics\nprint(statistics.median([]))",
    "salida": [],
    "familia": "StatisticsError"
  },
  {
    "nombre": "raíz de negativo",
    "archivos": {},
    "programa": "import math\nprint(math.sqrt(-1))",
    "salida": [],
    "familia": "ValueError"
  },
  {
    "nombre": "floor de un texto",
    "archivos": {},
    "programa": "import math\nprint(math.floor(\"3\"))",
    "salida": [],
    "familia": "TypeError"
  },
  {
    "nombre": "media de textos",
    "archivos": {},
    "programa": "import statistics\nprint(statistics.mean([\"1\", \"2\"]))",
    "salida": [],
    "familia": "TypeError"
  },
  {
    "nombre": "error dentro del módulo",
    "archivos": {
      "roto.py": "def f(x):\n    return x / 0\n"
    },
    "programa": "import roto\nprint(\"antes\")\nroto.f(1)",
    "salida": [
      "antes"
    ],
    "familia": "ZeroDivisionError"
  }
];
