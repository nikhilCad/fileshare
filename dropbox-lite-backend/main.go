package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/gorilla/mux"
	_ "github.com/mattn/go-sqlite3"
)

// File metadata struct
type FileMeta struct {
	ID               int       `json:"id"`
	Filename         string    `json:"filename"`
	OriginalFilename string    `json:"original_filename"`
	Mimetype         string    `json:"mimetype"`
	Size             int64     `json:"size"`
	UploadDate       time.Time `json:"upload_date"`
}

// Add theme preferences struct
// For simplicity, assume a single user (id=1)
type ThemePreferences struct {
	Theme        string `json:"theme"`
	GradientFrom string `json:"gradient_from"`
	GradientTo   string `json:"gradient_to"`
	GradientOn   bool   `json:"gradient_on"`
}

var db *sql.DB

// Allowed file extensions
var allowedExt = map[string]bool{
	".txt":  true,
	".png":  true,
	".jpg":  true,
	".jpeg": true,
	".json": true,
}

// CORS middleware
func withCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func main() {
	var err error
	// Open SQLite DB (creates if not exists)
	db, err = sql.Open("sqlite3", "files.db")
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	// Create uploads directory if not exists
	os.MkdirAll("uploads", os.ModePerm)

	// Create files table if not exists
	_, err = db.Exec(`CREATE TABLE IF NOT EXISTS files (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		filename TEXT,
		original_filename TEXT,
		mimetype TEXT,
		size INTEGER,
		upload_date DATETIME
	)`)
	if err != nil {
		log.Fatal(err)
	}

	// Create theme_preferences table if not exists
	_, err = db.Exec(`CREATE TABLE IF NOT EXISTS theme_preferences (
		id INTEGER PRIMARY KEY,
		theme TEXT,
		gradient_from TEXT,
		gradient_to TEXT,
		gradient_on INTEGER
	)`)
	if err != nil {
		log.Fatal(err)
	}

	r := mux.NewRouter()
	r.HandleFunc("/files", uploadFileHandler).Methods("POST")
	r.HandleFunc("/files", listFilesHandler).Methods("GET")
	r.HandleFunc("/files/{id:[0-9]+}", downloadFileHandler).Methods("GET")
	r.HandleFunc("/files/{id:[0-9]+}", deleteFileHandler).Methods("DELETE")
	// Theme endpoints
	r.HandleFunc("/theme", getThemeHandler).Methods("GET")
	r.HandleFunc("/theme", setThemeHandler).Methods("POST")

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	fmt.Println("Server started at :" + port)
	http.ListenAndServe(":"+port, withCORS(r))
}

// Handle file upload
func uploadFileHandler(w http.ResponseWriter, r *http.Request) {
	r.ParseMultipartForm(10 << 20) // 10MB max
	file, handler, err := r.FormFile("file")
	if err != nil {
		http.Error(w, "File is required", http.StatusBadRequest)
		return
	}
	defer file.Close()

	ext := strings.ToLower(filepath.Ext(handler.Filename))
	if !allowedExt[ext] {
		http.Error(w, "File type not allowed", http.StatusBadRequest)
		return
	}

	// Save file to uploads directory with unique name
	filename := fmt.Sprintf("%d%s", time.Now().UnixNano(), ext)
	filepath := filepath.Join("uploads", filename)
	out, err := os.Create(filepath)
	if err != nil {
		http.Error(w, "Failed to save file", http.StatusInternalServerError)
		return
	}
	defer out.Close()

	size, err := io.Copy(out, file)
	if err != nil {
		http.Error(w, "Failed to save file", http.StatusInternalServerError)
		return
	}

	// Insert metadata into DB
	res, err := db.Exec(`INSERT INTO files (filename, original_filename, mimetype, size, upload_date) VALUES (?, ?, ?, ?, ?)`,
		filename, handler.Filename, handler.Header.Get("Content-Type"), size, time.Now())
	if err != nil {
		http.Error(w, "Failed to save metadata", http.StatusInternalServerError)
		return
	}
	id, _ := res.LastInsertId()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{"id": id})
}

// Handle list files
func listFilesHandler(w http.ResponseWriter, r *http.Request) {
	rows, err := db.Query(`SELECT id, filename, original_filename, mimetype, size, upload_date FROM files ORDER BY upload_date DESC`)
	if err != nil {
		http.Error(w, "Failed to fetch files", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var files []FileMeta
	for rows.Next() {
		var f FileMeta
		var uploadDate string
		if err := rows.Scan(&f.ID, &f.Filename, &f.OriginalFilename, &f.Mimetype, &f.Size, &uploadDate); err != nil {
			continue
		}
		f.UploadDate, _ = time.Parse(time.RFC3339, uploadDate)
		files = append(files, f)
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(files)
}

// Handle file download
func downloadFileHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	var filename, originalFilename, mimetype string
	row := db.QueryRow(`SELECT filename, original_filename, mimetype FROM files WHERE id = ?`, id)
	if err := row.Scan(&filename, &originalFilename, &mimetype); err != nil {
		http.Error(w, "File not found", http.StatusNotFound)
		return
	}
	filepath := filepath.Join("uploads", filename)
	f, err := os.Open(filepath)
	if err != nil {
		http.Error(w, "File not found on disk", http.StatusNotFound)
		return
	}
	defer f.Close()

	w.Header().Set("Content-Disposition", "attachment; filename=\""+originalFilename+"\"")
	w.Header().Set("Content-Type", mimetype)
	io.Copy(w, f)
}

// Handle file delete
func deleteFileHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	// Get filename from DB
	var filename string
	row := db.QueryRow(`SELECT filename FROM files WHERE id = ?`, id)
	if err := row.Scan(&filename); err != nil {
		http.Error(w, "File not found", http.StatusNotFound)
		return
	}
	// Delete file from disk
	filePath := filepath.Join("uploads", filename)
	os.Remove(filePath)
	// Delete metadata from DB
	_, err := db.Exec(`DELETE FROM files WHERE id = ?`, id)
	if err != nil {
		http.Error(w, "Failed to delete metadata", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// GET /theme
func getThemeHandler(w http.ResponseWriter, r *http.Request) {
	var prefs ThemePreferences
	row := db.QueryRow(`SELECT theme, gradient_from, gradient_to, gradient_on FROM theme_preferences WHERE id = 1`)
	var gradientOnInt int
	err := row.Scan(&prefs.Theme, &prefs.GradientFrom, &prefs.GradientTo, &gradientOnInt)
	if err == sql.ErrNoRows {
		// Return default
		prefs = ThemePreferences{
			Theme:        "dark",
			GradientFrom: "#23272a",
			GradientTo:   "#a5b4fc",
			GradientOn:   true,
		}
	} else if err != nil {
		http.Error(w, "Failed to fetch theme", http.StatusInternalServerError)
		return
	} else {
		prefs.GradientOn = gradientOnInt != 0
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(prefs)
}

// POST /theme
func setThemeHandler(w http.ResponseWriter, r *http.Request) {
	var prefs ThemePreferences
	if err := json.NewDecoder(r.Body).Decode(&prefs); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}
	// Upsert (insert or update)
	_, err := db.Exec(`INSERT INTO theme_preferences (id, theme, gradient_from, gradient_to, gradient_on) VALUES (1, ?, ?, ?, ?)
		ON CONFLICT(id) DO UPDATE SET theme=excluded.theme, gradient_from=excluded.gradient_from, gradient_to=excluded.gradient_to, gradient_on=excluded.gradient_on`,
		prefs.Theme, prefs.GradientFrom, prefs.GradientTo, boolToInt(prefs.GradientOn))
	if err != nil {
		http.Error(w, "Failed to save theme", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// Helper
func boolToInt(b bool) int {
	if b {
		return 1
	}
	return 0
}
