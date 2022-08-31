mongo -- "taggerkeeper" <<EOF
    var admin = db.getSiblingDB('admin');
    admin.auth('$MONGO_INITDB_ROOT_USERNAME', 'MONGO_INITDB_ROOT_PASSWORD');
    db.createUser({user: 'taggerkeeper', pwd: '$PASSWORD', roles: [{ role: "readWrite", db: "taggerkeeper" }]});
EOF
