{
  pkgs ? import <nixpkgs> {} # here we import the nixpkgs package set
}:
pkgs.mkShell {               # mkShell is a helper function
  name="dev-environment";    # that requires a name
  buildInputs = [            # and a list of packages
    pkgs.nodejs-12_x         # minimum supported NodeJS
  ];
  shellHook =                # bash to run when you enter the shell 
  ''
    echo "Node.js v12";             
    echo "Start developing...";
  '';
}
