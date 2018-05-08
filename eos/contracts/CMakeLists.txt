
cmake_minimum_required(VERSION 3.5)

set( CMAKE_CXX_STANDARD 14 )
set( CMAKE_CXX_EXTENSIONS ON )
set( CXX_STANDARD_REQUIRED ON)

set( CLI_CLIENT_EXECUTABLE_NAME cleos )
set( GUI_CLIENT_EXECUTABLE_NAME eosio )


if(NOT PROJECT_ROOT)
	get_filename_component(PROJECT_ROOT ${CMAKE_SOURCE_DIR}/../.. ABSOLUTE)
endif()

if(NOT DEPS_DIR)
    set(DEPS_DIR ${PROECT_ROOT}/deps)
endif()

set(CONTRACTS_SRC ${DEPS_DIR}/contracts_src)

list(APPEND CMAKE_MODULE_PATH "${DEPS_DIR}/CMakeModules")
set(WASM_ROOT ${DEPS_DIR}/bin)
# include( wasm )

set(DEFAULT_SYSTEM_INCLUDE_FOLDERS ${CONTRACTS_SRC}/libc++/upstream/include ${CONTRACTS_SRC}/musl/upstream/include ${Boost_INCLUDE_DIR})
set(STANDARD_INCLUDE_FOLDERS ${CONTRACTS_SRC} ${CMAKE_SOURCE_DIR}/externals/magic_get/include)

message("CMAKE_MODULE_PATH: ${CMAKE_MODULE_PATH}")
message("CMAKE_SOURCE_DIR: ${CMAKE_SOURCE_DIR}")
message("PROJECT_ROOT: ${PROJECT_ROOT}")
message("DEPS_DIR: ${DEPS_DIR}")
message("CONTRACTS_SRC: ${CONTRACTS_SRC}")
message("DEFAULT_SYSTEM_INCLUDE_FOLDERS: ${DEFAULT_SYSTEM_INCLUDE_FOLDERS}")
message("STANDARD_INCLUDE_FOLDERS: ${STANDARD_INCLUDE_FOLDERS}")


add_subdirectory( emanatecolab )
add_subdirectory( emanatecur )
