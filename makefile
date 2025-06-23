# Makefile untuk mencetak semua file, kecuali:
# - isi file gambar tidak ditampilkan (hanya path)

.PHONY: list export

list:
	@find . -type f ! -path "./.git/*" | sort | while read file; do \
		echo "===== $$file ====="; \
		if file "$$file" | grep -qE 'image|bitmap' && ! [[ "$$file" =~ ^./icons/ ]]; then \
			echo "[file gambar: isi tidak ditampilkan]"; \
		else \
			cat "$$file"; \
		fi; \
		echo ""; \
	done

export:
	@find . -type f ! -path "./.git/*" | sort | while read file; do \
		echo "===== $$file ====="; \
		if file "$$file" | grep -qE 'image|bitmap' && ! [[ "$$file" =~ ^./icons/ ]]; then \
			echo "[file gambar: isi tidak ditampilkan]"; \
		else \
			cat "$$file"; \
		fi; \
		echo ""; \
	done > listing.txt
	@echo "Listing file sudah diekspor ke listing.txt"