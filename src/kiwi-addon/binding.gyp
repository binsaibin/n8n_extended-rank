{
  "targets": [
    {
      "target_name": "kiwi_addon",
      "sources": ["addon.cc"],
      "include_dirs": [
        "<!@(node -p \"require('node-addon-api').include\")",
        "./include",
        "."
      ],
      "libraries": ["-lkiwi", "-L/usr/local/lib"],
      "cflags": [
        "-std=c++17",
        "-fexceptions",  # Enable exceptions
        "-frtti"         # Enable RTTI
      ],
      "cflags_cc!": [
        "-fno-exceptions",  # Override default -fno-exceptions
        "-fno-rtti"         # Override default -fno-rtti
      ],
      "defines": ["NAPI_DISABLE_CPP_EXCEPTIONS"]
    }
  ]
}
